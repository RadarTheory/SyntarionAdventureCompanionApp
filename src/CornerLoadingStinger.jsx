import React from 'react';

export default class CornerLoadingStinger extends React.Component {
  static defaultProps = { enabled: true };

  constructor(props) {
    super(props);
    this.state = { visible: false, videoSrc: '/loading-stinger-20260712.mp4' };
    this.videoRef = React.createRef();
    this.hideTimer = null;
    this.playStinger = this.playStinger.bind(this);
  }

  componentDidMount() {
    if (this.props.enabled) window.addEventListener('syntarion-screen-change', this.playStinger);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.enabled === this.props.enabled) return;
    if (this.props.enabled) window.addEventListener('syntarion-screen-change', this.playStinger);
    else window.removeEventListener('syntarion-screen-change', this.playStinger);
  }

  componentWillUnmount() {
    window.removeEventListener('syntarion-screen-change', this.playStinger);
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }

  playStinger() {
    if (!this.props.enabled) return;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.setState({ visible: true, videoSrc: '/loading-stinger-20260712.mp4?t=' + Date.now() }, () => {
      requestAnimationFrame(() => {
        const video = this.videoRef.current;
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(() => {});
      });
      this.hideTimer = setTimeout(() => this.setState({ visible: false }), 2200);
    });
  }

  render() {
    if (!this.props.enabled || !this.state.visible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          width: 180,
          height: 180,
          zIndex: 999999,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 18,
        }}
      >
        <video
          key={this.state.videoSrc}
          ref={this.videoRef}
          src={this.state.videoSrc}
          muted
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'screen',
            display: 'block',
          }}
        />
      </div>
    );
  }
}
