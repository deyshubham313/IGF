import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';

export default function ProductCard({ product, onClick }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWish, isWished } = useWishlist();
  const { showToast } = useToast();

  const tag = product.tag || '';

  const handleCart = (e) => {
    e.stopPropagation();
    addToCart({
      productId: product.id || product._id,
      productName: product.name,
      productImage: product.image,
      category: product.category || product.categoryName,
      quantity: 1
    });
    showToast(`${product.name} added to cart!`, 'success');
  };

  const handleWish = (e) => {
    e.stopPropagation();
    toggleWish({
      productId: product.id || product._id,
      productName: product.name,
      productImage: product.image,
      category: product.category || product.categoryName
    });
    const wished = isWished(product.id || product._id);
    showToast(wished ? 'Removed from wishlist' : `${product.name} added to wishlist!`, wished ? 'default' : 'success');
  };

  return (
    <div className="product-card" onClick={() => onClick ? onClick(product) : navigate(`/products/${product.id || product._id}`)}>
      <div className="product-card-glow"></div>
      
      {tag && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 5, padding: '4px 10px',
          borderRadius: 3, fontSize: '0.5rem', fontFamily: 'Orbitron,sans-serif',
          letterSpacing: '0.12em', fontWeight: 700,
          background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.3)', color: '#ff5722'
        }}>
          {tag}
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWish}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 5, width: 32, height: 32,
          background: 'rgba(13,7,5,0.7)',
          border: `1px solid ${isWished(product.id || product._id) ? '#ef4444' : 'rgba(255,87,34,0.2)'}`,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s', color: isWished(product.id || product._id) ? '#ef4444' : 'var(--text-muted)', fontSize: '0.85rem'
        }}>
        {isWished(product.id || product._id) ? '♥' : '♡'}
      </button>

      {/* Cart Button */}
      <button
        onClick={handleCart}
        style={{
          position: 'absolute', top: 48, right: 10, zIndex: 5, width: 32, height: 32,
          background: 'rgba(13,7,5,0.7)',
          border: '1px solid rgba(255,87,34,0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s', color: 'var(--text-muted)', fontSize: '0.85rem'
        }}
        title="Add to Cart"
      >
        🛒
      </button>

      <div className="product-card-thumb">
        <img 
          src={`/${product.image}`} 
          alt={product.name} 
          onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='block'; }}
        />
        <img src={`/${product.categoryIcon || 'assets/logo2-scaled.png'}`} className="thumb-icon" style={{display: 'none'}} alt="" />
        <div className="product-card-thumb-overlay"></div>
        <div className="product-card-view-pill">VIEW DETAILS</div>
      </div>
      
      <div className="product-card-body">
        <div className="product-card-count">
          <span className="product-card-count-dot"></span>MODEL
        </div>
        <div className="product-name">{product.name}</div>
        <div className="product-desc">{product.shortDesc || "High-quality commercial grade amusement machine for entertainment centers."}</div>
        <div className="product-card-footer">
          <span className="product-card-explore">EXPLORE →</span>
          <div className="product-arrow">›</div>
        </div>
      </div>
    </div>
  );
}
