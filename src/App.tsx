
import { Route, Routes } from '@/lib/router'

import Index from './screens/index'
import IndexTwo from './screens/index/index-two'
import IndexThree from './screens/index/index-three'
import IndexFour from './screens/index/index-four'
import IndexFive from './screens/index/index-five'
import IndexSix from './screens/index/index-six'
import About from './screens/inner-pages/about'
import Pricing from './screens/inner-pages/pricing'
import Team from './screens/inner-pages/team'
import OurClients from './screens/inner-pages/our-clients'
import Faq from './screens/inner-pages/faq'
import TermsAndConditions from './screens/inner-pages/terms-and-conditions'
import PortfolioV1 from './screens/portfolio/portfolio-v1'
import PortfolioV2 from './screens/portfolio/portfolio-v2'
import PortfolioV3 from './screens/portfolio/portfolio-v3'
import PortfolioDetailsV1 from './screens/portfolio/portfolio-details-v1'
import PortfolioDetailsV2 from './screens/portfolio/portfolio-details-v2'
import Error from './screens/special/error'
import MyProfile from './screens/account/my-profile'
import MyAccount from './screens/account/my-account'
import EditAccount from './screens/account/edit-account'
import OrderHistory from './screens/account/order-history'
import Wishlist from './screens/account/wishlist'
import Login from './screens/auth/login'
import Register from './screens/auth/register'
import ForgerPassword from './screens/auth/forger-password'
import ComingSoon from './screens/special/coming-soon'
import ThankYou from './screens/special/thank-you'
import ShippingMethod from './screens/shop/shipping-method'
import PaymentMethod from './screens/shop/payment-method'
import Invoice from './screens/shop/invoice'
import PaymentConfirmation from './screens/shop/payment-confirmation'
import PaymentSuccess from './screens/shop/payment-success'
import PaymentFailure from './screens/shop/payment-failure'
import Cart from './screens/shop/cart'
import Checkout from './screens/shop/checkout'
import ShopV1 from './screens/shop/shop-v1'
import ShopV2 from './screens/shop/shop-v2'
import ShopV3 from './screens/shop/shop-v3'
import ShopV4 from './screens/shop/shop-v4'
import ProductDetails from './screens/index/product-details'
import BlogV1 from './screens/blog/blog-v1'
import BlogV2 from './screens/blog/blog-v2'
import BlogDetailsV1 from './screens/blog/blog-details-v1'
import BlogDetailsV2 from './screens/blog/blog-details-v2'
import BlogDetailsV3 from './screens/blog/blog-details-v3'
import BlogTag from './screens/blog/blog-tag'
import Contact from './screens/inner-pages/contact'
import ProductCategory from './screens/shop/product-category'
import ReturnPolicy from './screens/inner-pages/return-policy'
// import { PortraitFrames, CanvasPaintings, TempleArtPrints, WallMurals, ModernWallpapers, CustomizeBlinds, NeonSigns, BacklitLed } from './screens/index'
import PortraitFrames from './screens/category/PortraitFrames'
import CanvasPaintings from './screens/category/CanvasPaintings'
import TempleArtPrints from './screens/category/TempleArtPrints'
import WallMurals from './screens/category/WallMurals'
import ModernWallpapers from './screens/category/ModernWallpapers'
import CustomizeBlinds from './screens/category/CustomizeBlinds'
import NeonSigns from './screens/category/NeonSigns'
import BacklitLed from './screens/category/BacklitLed'
import CategoryPage from './screens/category/CategoryPage'
function App() {

  return (
    <>
    
     <Routes>
          <Route path="/" element={<Index/>} />
          <Route path="/index-v2" element={<IndexTwo/>} />
          <Route path="/index-v3" element={<IndexThree/>} />
          <Route path="/index-v4" element={<IndexFour/>} />
          <Route path="/index-v5" element={<IndexFive/>} />
          <Route path="/index-v6" element={<IndexSix/>} />
          <Route path="/about" element={<About/>} />
          <Route path="/pricing" element={<Pricing/>} />
          <Route path="/team" element={<Team/>} />
          <Route path="/our-clients" element={<OurClients/>} />
          <Route path="/faq" element={<Faq/>} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions/>} />
          <Route path="/portfolio-v1" element={<PortfolioV1/>} />
          <Route path="/portfolio-v2" element={<PortfolioV2/>} />
          <Route path="/portfolio-v3" element={<PortfolioV3/>} />
          <Route path="/portfolio-details-v1" element={<PortfolioDetailsV1/>} />
          <Route path="/portfolio-details-v1/:id" element={<PortfolioDetailsV1/>} />
          <Route path="/portfolio-details-v2" element={<PortfolioDetailsV2/>} />
          <Route path="/portfolio-details-v2/:id" element={<PortfolioDetailsV2/>} />
          <Route path="/error" element={<Error/>} />
          <Route path="/my-profile" element={<MyProfile/>} />
          <Route path="/my-account" element={<MyAccount/>} />
          <Route path="/edit-account" element={<EditAccount/>} />
          <Route path="/order-history" element={<OrderHistory/>} />
          <Route path="/wishlist" element={<Wishlist/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/forgot-password" element={<ForgerPassword/>} />
          <Route path="/coming-soon" element={<ComingSoon/>} />
          <Route path="/thank-you" element={<ThankYou/>} />
          <Route path="/shipping-method" element={<ShippingMethod/>} />
          <Route path="/payment-method" element={<PaymentMethod/>} />
          <Route path="/invoice" element={<Invoice/>} />
          <Route path="/payment-confirmation" element={<PaymentConfirmation/>} />
          <Route path="/payment-success" element={<PaymentSuccess/>} />
          <Route path="/payment-failure" element={<PaymentFailure/>} />
          <Route path="/cart" element={<Cart/>} />
          <Route path="/checkout" element={<Checkout/>} />
          <Route path="/shop-v1" element={<ShopV1/>} />
          <Route path="/shop-v2" element={<ShopV2/>} />
          <Route path="/shop-v3" element={<ShopV3/>} />
          <Route path="/shop-v4" element={<ShopV4/>} />
          <Route path="/product-details" element={<ProductDetails/>} />
          <Route path="/product-details/:id" element={<ProductDetails/>} />
          <Route path="/blog-v1" element={<BlogV1/>} />
          <Route path="/blog-v2" element={<BlogV2/>} />
          <Route path="/blog-details-v1" element={<BlogDetailsV1/>} />
          <Route path="/blog-details-v1/:id" element={<BlogDetailsV1/>} />
          <Route path="/blog-details-v2" element={<BlogDetailsV2/>} />
          <Route path="/blog-details-v2/:id" element={<BlogDetailsV2/>} />
          <Route path="/blog-details-v3" element={<BlogDetailsV3/>} />
          <Route path="/blog-tag" element={<BlogTag/>} />
          <Route path="/contact" element={<Contact/>} />
          <Route path="/product-category" element={<ProductCategory/>} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          {/* <Route path="/category/:slug" element={<CategoryPage />} /> */}
          <Route path="/category/portrait-frames" element={<PortraitFrames />} />
          <Route path="/category/canvas-paintings" element={<CanvasPaintings />} />
          <Route path="/category/temple-art-prints" element={<TempleArtPrints />} />
          <Route path="/category/wall-murals" element={<WallMurals />} />
          <Route path="/category/modern-wallpapers" element={<ModernWallpapers />} />
          <Route path="/category/customize-blinds" element={<CustomizeBlinds />} />
          <Route path="/category/neon-signs" element={<NeonSigns />} />
          <Route path="/category/backlit-led" element={<BacklitLed />} />
          <Route path="/category" element={<CategoryPage />} />

          
     </Routes>
    </>
  )
}

export default App
