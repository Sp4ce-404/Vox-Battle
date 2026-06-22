// Record panel controller that orchestrates recording, playback, timer updates, and sharing.

export default class RecordPanel {
  constructor(audioEngine, onMicAccessSuccess, onMicAccessFailure) {
    this.engine = audioEngine;
    this.onMicSuccess = onMicAccessSuccess;
    this.onMicFailure = onMicAccessFailure;
    
    // DOM Cache
    this.recordBtn = document.getElementById("record-btn");
    this.timerText = document.getElementById("record-timer");
    this.hearMyselfToggle = document.getElementById("hear-myself-toggle");
    
    this.playbackCard = document.getElementById("playback-card");
    this.playbackPlayBtn = document.getElementById("playback-play-btn");
    this.playbackProgress = document.getElementById("playback-progress");
    this.playbackTime = document.getElementById("playback-time");
    
    this.downloadBtn = document.getElementById("download-record-btn");
    this.shareBtn = document.getElementById("share-record-btn");
    
    this.enableMicBtn = document.getElementById("enable-mic-btn");
    this.permissionPrompt = document.getElementById("mic-permission-prompt");
    this.activePresetBadge = document.getElementById("record-active-preset");
    
    // Local State
    this.timerInterval = null;
    this.recordingDuration = 0;
    this.recordedBlob = null;
    this.audioElement = new Audio();
    this.isPlayingPlayback = false;
    
    this.init();
  }

init() {
  const safeOn = (el, ev, fn) => { if (el && el.addEventListener) el.addEventListener(ev, fn); };

  safeOn(this.enableMicBtn, "click", () => this.requestMicPermission());
  safeOn(this.recordBtn, "click", () => this.toggleRecording());
  safeOn(this.hearMyselfToggle, "change", (e) => this.engine.setHearMyself(e.target.checked));
  safeOn(this.playbackPlayBtn, "click", () => this.togglePlayback());

  if (this.audioElement && this.audioElement.addEventListener) {
    this.audioElement.addEventListener("timeupdate", () => this.updatePlaybackProgress());
    this.audioElement.addEventListener("ended", () => {
      this.isPlayingPlayback = false;
      if (this.playbackPlayBtn) this.playbackPlayBtn.textContent = "PLAY";
      if (this.playbackProgress) this.playbackProgress.style.width = "0%";
    });
  }

  safeOn(this.downloadBtn, "click", () => this.downloadAudio());
  safeOn(this.shareBtn, "click", () => this.shareAudio());
}

  async requestMicPermission() {
    try {
      await this.engine.startMic();
      this.permissionPrompt.classList.add("hidden");
      document.getElementById("mic-status").classList.add("active");
      document.getElementById("mic-status").querySelector(".indicator-text").textContent = "MIC ON";
      
      // Auto enable hear myself on desktop, keep off on mobile to prevent feedback loops
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.hearMyselfToggle.checked = !isMobile;
      this.engine.setHearMyself(!isMobile);
      
      if (typeof this.onMicSuccess === "function") {
        this.onMicSuccess();
      }
    } catch (e) {
      console.error("Microphone permission denied:", e);
      alert("MICROPHONE ERROR: Please allow mic permissions in your browser settings to modulate your voice.");
      if (typeof this.onMicFailure === "function") {
        this.onMicFailure();
      }
    }
  }

  async toggleRecording() {
    if (!this.engine.isMicActive) {
      await this.requestMicPermission();
      if (!this.engine.isMicActive) return;
    }
    
    if (!this.engine.isRecording) {
      // Start
      this.engine.startRecording();
      this.recordBtn.classList.add("recording");
      this.playbackCard.classList.add("hidden");
      this.recordedBlob = null;
      
      // Timer setup
      this.recordingDuration = 0;
      this.timerText.textContent = "00:00";
      this.timerInterval = setInterval(() => {
        this.recordingDuration++;
        const mins = String(Math.floor(this.recordingDuration / 60)).padStart(2, "0");
        const secs = String(this.recordingDuration % 60).padStart(2, "0");
        this.timerText.textContent = `${mins}:${secs}`;
      }, 1000);
      
    } else {
      // Stop
      clearInterval(this.timerInterval);
      this.recordBtn.classList.remove("recording");
      
      const blob = await this.engine.stopRecording();
      if (blob && blob.size > 100) {
        this.recordedBlob = blob;
        this.audioElement.src = URL.createObjectURL(blob);
        this.playbackCard.classList.remove("hidden");
      }
    }
  }

  togglePlayback() {
    if (!this.recordedBlob) return;
    
    if (!this.isPlayingPlayback) {
      this.audioElement.play();
      this.playbackPlayBtn.textContent = "PAUSE";
      this.isPlayingPlayback = true;
    } else {
      this.audioElement.pause();
      this.playbackPlayBtn.textContent = "PLAY";
      this.isPlayingPlayback = false;
    }
  }

  updatePlaybackProgress() {
    if (!this.audioElement.duration) return;
    
    const current = this.audioElement.currentTime;
    const total = this.audioElement.duration;
    const pct = (current / total) * 100;
    
    this.playbackProgress.style.width = `${pct}%`;
    
    // Time label formatting
    const formatTime = (time) => {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins}:${String(secs).padStart(2, "0")}`;
    };
    
    this.playbackTime.textContent = `${formatTime(current)} / ${formatTime(total)}`;
  }

  downloadAudio() {
    if (!this.recordedBlob) return;
    
    // Detect container extension
    const ext = this.recordedBlob.type.includes("ogg") ? "ogg" : "webm";
    const filename = `voxforge_${Date.now()}.${ext}`;
    
    const a = document.createElement("a");
    a.href = this.audioElement.src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async shareAudio() {
    if (!this.recordedBlob) return;
    
    const ext = this.recordedBlob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([this.recordedBlob], `voxforge_${Date.now()}.${ext}`, {
      type: this.recordedBlob.type
    });
    
    // Check Web Share API capabilities
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My VoxForge Voice Clip",
          text: "Check out my game voice preset from VoxForge!"
        });
        console.log("Audio shared successfully");
      } catch (e) {
        console.error("Web share failed:", e);
      }
    } else {
      // Fallback if not supported (e.g. some desktop browsers)
      alert("Sharing files is only supported on mobile devices/Chrome Android. Use the SAVE button to export manually.");
    }
  }

  updateActivePresetName(name) {
    this.activePresetBadge.textContent = name.toUpperCase();
  }
}
