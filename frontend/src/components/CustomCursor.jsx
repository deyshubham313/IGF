import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      document.body.classList.remove('custom-cursor-active');
      document.body.style.cursor = 'default';
      return;
    }

    document.body.classList.add('custom-cursor-active');
    document.body.style.cursor = 'none';

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    let animId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      animId = requestAnimationFrame(animateRing);
    };

    const onMouseDown = () => { cursor.classList.add('click'); ring.classList.add('click'); };
    const onMouseUp = () => { cursor.classList.remove('click'); ring.classList.remove('click'); };
    
    const onMouseOver = (e) => {
      if (e.target.closest('a, button, input, select, textarea, [role="button"], .product-card, .cat-prod-card, .showcase-card, .why-card')) {
        cursor.style.transform = 'translate(-50%,-50%) scale(2)';
        ring.style.transform = 'translate(-50%,-50%) scale(1.5)';
      }
    };

    const onMouseOut = (e) => {
      if (e.target.closest('a, button, input, select, textarea, [role="button"], .product-card, .cat-prod-card, .showcase-card, .why-card')) {
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    animId = requestAnimationFrame(animateRing);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animId);
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}
