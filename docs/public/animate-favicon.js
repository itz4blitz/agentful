// Animated favicon using Canvas API
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  const totalFrames = 60; // 60 frames for smooth 4-second loop at 15fps
  const particlePositions = [0, 0.33, 0.66]; // 3 particles offset

  // Triangle coordinates
  const triangle = [
    { x: 24, y: 12 },   // top
    { x: 14, y: 32 },   // bottom-left
    { x: 34, y: 32 },   // bottom-right
  ];

  // Calculate position along triangle path
  function getPositionOnPath(progress) {
    // Path: top -> bottom-left -> bottom-right -> top
    const totalLength = 3; // 3 segments
    const segment = Math.floor(progress * totalLength);
    const segmentProgress = (progress * totalLength) % 1;

    let start, end;
    if (segment === 0) {
      start = triangle[0];
      end = triangle[1];
    } else if (segment === 1) {
      start = triangle[1];
      end = triangle[2];
    } else {
      start = triangle[2];
      end = triangle[0];
    }

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress
    };
  }

  function drawFrame() {
    // Clear canvas
    ctx.clearRect(0, 0, 48, 48);

    // Draw triangle lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9;

    // Top to bottom-left
    ctx.beginPath();
    ctx.moveTo(24, 12);
    ctx.lineTo(14, 32);
    ctx.stroke();

    // Top to bottom-right
    ctx.beginPath();
    ctx.moveTo(24, 12);
    ctx.lineTo(34, 32);
    ctx.stroke();

    // Bottom line (brighter)
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(14, 32);
    ctx.lineTo(34, 32);
    ctx.stroke();

    // Draw diamond nodes
    ctx.fillStyle = '#10b981';
    ctx.globalAlpha = 0.9;

    // Top diamond
    ctx.beginPath();
    ctx.moveTo(24, 10);
    ctx.lineTo(26, 12);
    ctx.lineTo(24, 14);
    ctx.lineTo(22, 12);
    ctx.closePath();
    ctx.fill();

    // Bottom-left diamond
    ctx.beginPath();
    ctx.moveTo(14, 30);
    ctx.lineTo(16, 32);
    ctx.lineTo(14, 34);
    ctx.lineTo(12, 32);
    ctx.closePath();
    ctx.fill();

    // Bottom-right diamond
    ctx.beginPath();
    ctx.moveTo(34, 30);
    ctx.lineTo(36, 32);
    ctx.lineTo(34, 34);
    ctx.lineTo(32, 32);
    ctx.closePath();
    ctx.fill();

    // Draw particles
    ctx.fillStyle = '#06b6d4';
    ctx.globalAlpha = 1;

    particlePositions.forEach(offset => {
      const progress = ((frame / totalFrames) + offset) % 1;
      const pos = getPositionOnPath(progress);

      // Draw glowing particle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Add glow
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Update favicon
    const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    if (!document.querySelector('link[rel="icon"]')) {
      document.head.appendChild(link);
    }

    frame = (frame + 1) % totalFrames;
  }

  // Animate at 15fps (smooth enough for favicon)
  setInterval(drawFrame, 1000 / 15);
})();
