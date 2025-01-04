'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  baseRadius: number;
  radius: number;
  speed: number;
  angle: number;
  angleSpeed: number;
  opacity: number;
  pulseOffset: number;
}

const AGIThoughtBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particleCount, setParticleCount] = useState(150);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Adjust particle count based on screen resolution
        const newParticleCount = Math.floor(
          (canvas.width * canvas.height) / 10000
        );
        setParticleCount(Math.max(150, newParticleCount)); // Ensure a minimum of 150 particles
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const particles: Particle[] = [];

    const createParticles = () => {
      particles.length = 0; // Clear existing particles
      for (let i = 0; i < particleCount; i++) {
        const baseRadius = Math.random() * 2 + 1;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseRadius,
          radius: baseRadius,
          speed: Math.random() * 0.5 + 0.1,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.02,
          opacity: Math.random() * 0.5 + 0.5,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    createParticles();

    const drawParticles = (time: number) => {
      ctx.fillStyle = '#f3f4f6'; // This matches Tailwind's bg-gray-100
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update particle properties
        particle.angle += particle.angleSpeed;
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;

        // Pulsate the radius
        const pulseFactor =
          Math.sin(time * 0.002 + particle.pulseOffset) * 0.2 + 1;
        particle.radius = particle.baseRadius * pulseFactor;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 129, 217, ${particle.opacity})`; // Slightly darker blue for better contrast
        ctx.fill();
      });

      // Draw connections
      ctx.strokeStyle = 'rgba(80, 129, 217, 0.1)'; // Matching the particle color
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-[100vw] h-[100vh] -z-10"
    />
  );
};

export default AGIThoughtBackground;
