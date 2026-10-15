import { ATTA_GRAINS, GHEE_DAIRY, NATURAL_SWEETENERS, SNACKS } from '@/lib/brand'

// src/data/categoryData.ts
// =============================================================================
//  All 8 category definitions — products, images, metadata, accent colours
//  Images: Unsplash CDN (free, no-auth)
// =============================================================================

export interface CategoryProduct {
    id: number;
    image: string;
    tag: string;
    price: string;
    name: string;
    category: string;
    rating: number;
    badge?: string; // 'New' | 'Sale' | 'Hot'
  }
  
  export interface CategoryConfig {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    heroImage: string;
    accent: string;         // CSS hex colour for highlights
    accentLight: string;    // lighter tint for backgrounds
    icon: string;           // emoji icon
    products: CategoryProduct[];
    filterTags: string[];
  }
  
  // ─── 1. Portrait Frames ────────────────────────────────────────────────────────
  const portraitFrames: CategoryProduct[] = [
    { id: 101, category: 'portrait-frames', name: 'Classic Gold Ornate Frame', price: '$89.00', tag: 'Bestseller', image: 'https://m.media-amazon.com/images/I/811TfblWP+L._AC_UL320_.jpg', rating: 5 },
    { id: 102, category: 'portrait-frames', name: 'Slim Black Minimalist Frame', price: '$45.00', tag: 'New Arrival', image: 'https://assets.myntassets.com/w_360,q_50,,dpr_2,fl_progressive,f_webp/assets/images/9823103/2019/5/27/5ab22a35-0902-4459-be08-0c3a1136fdc81558945371311-Art-Street-Black-Solid-Wall-Photo-Frames-4401558945370487-1.jpg', rating: 4, badge: 'New' },
    { id: 103, category: 'portrait-frames', name: 'Rustic Barnwood Frame 18×24', price: '$67.00', tag: 'Handcrafted', image: 'https://artstreet.in/cdn/shop/products/51rKUoSPtKL_1024x1024.jpg?v=1755503769', rating: 4 },
    { id: 104, category: 'portrait-frames', name: 'Shadow Box Display Frame', price: '$110.00', tag: 'Premium', image: 'https://images-eu.ssl-images-amazon.com/images/I/81Kc2a6d-mL._AC_UL210_SR210,210_.jpg', rating: 5, badge: 'Hot' },
    { id: 105, category: 'portrait-frames', name: 'Floating Acrylic Frame', price: '$78.00', tag: 'Modern', image: 'https://i.ebayimg.com/images/g/aWAAAeSwUBVo8YBR/s-l1600.jpg', rating: 4 },
    { id: 106, category: 'portrait-frames', name: 'Antique Silver Gallery Frame', price: '$95.00', tag: 'Vintage', image: 'https://images.unsplash.com/photo-1632258521940-b29d7d2ae9f5?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 5 },
    { id: 107, category: 'portrait-frames', name: 'Collage Multi-Photo Frame', price: '$55.00', tag: 'Sale', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', rating: 3, badge: 'Sale' },
    { id: 108, category: 'portrait-frames', name: 'Bamboo Eco Frame 12×16', price: '$39.00', tag: 'Eco-Friendly', image: 'https://images.unsplash.com/photo-1736696284321-81aa433f8e43?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 4 },
    { id: 109, category: 'portrait-frames', name: 'Baroque Gold Statement Frame', price: '$149.00', tag: 'Luxury', image: 'https://m.media-amazon.com/images/I/81Y48KF+poL.jpg', rating: 5 },
  ];
  
  // ─── 2. Canvas Paintings ───────────────────────────────────────────────────────
  const canvasPaintings: CategoryProduct[] = [
    { id: 201, category: 'canvas-paintings', name: 'Abstract Ocean Tides — 36×48"', price: '$189.00', tag: 'Original', image: 'https://images.unsplash.com/photo-1691849721970-e2e3ba443ed7?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 5, badge: 'New' },
    { id: 202, category: 'canvas-paintings', name: 'Golden Sunset Landscape', price: '$145.00', tag: 'Handpainted', image: 'https://plus.unsplash.com/premium_photo-1706152482956-ab99f887763f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 5 },
    { id: 203, category: 'canvas-paintings', name: 'Botanical Watercolour Print', price: '$98.00', tag: 'Print', image: 'https://plus.unsplash.com/premium_photo-1706152482904-b24236e1b076?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 4 },
    { id: 204, category: 'canvas-paintings', name: 'Geometric Minimalist Triptych', price: '$220.00', tag: 'Set of 3', image: 'https://plus.unsplash.com/premium_photo-1706152482843-e8da9cfef167?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 4, badge: 'Hot' },
    { id: 205, category: 'canvas-paintings', name: 'Forest Dawn Oil Painting', price: '$310.00', tag: 'Original Oil', image: 'https://images.unsplash.com/photo-1654376241128-b11af2412fa2?q=80&w=734&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', rating: 5 },
    { id: 206, category: 'canvas-paintings', name: 'Modern Abstract Splatter', price: '$167.00', tag: 'Contemporary', image: 'https://kotart.in/cdn/shop/files/KA-CA-21X33-P1-168_1.jpg?v=1697557460', rating: 4 },
    { id: 207, category: 'canvas-paintings', name: 'Vintage Map Canvas Art', price: '$79.00', tag: 'Sale', image: 'https://dekorstation.com/cdn/shop/files/1_0e59a0f1-8797-4fc5-87a5-ad426fce97b8.jpg?v=1747393671', rating: 3, badge: 'Sale' },
    { id: 208, category: 'canvas-paintings', name: 'Night Sky Acrylic Pour', price: '$134.00', tag: 'Handpainted', image: 'https://artstreet.in/cdn/shop/files/71A7a7KwBNL._SX522_522x522.jpg?v=1755504184', rating: 5 },
    { id: 209, category: 'canvas-paintings', name: 'Floral Impressionist Canvas', price: '$158.00', tag: 'Bestseller', image: 'https://img.tatacliq.com/images/i21//437Wx649H/MP000000024955420_437Wx649H_202501052034511.jpeg', rating: 4 },
  ];
  
  // ─── 3. Temple Art Prints ──────────────────────────────────────────────────────
  const templeArtPrints: CategoryProduct[] = [
    { id: 301, category: 'temple-art-prints', name: 'Lord Ganesha Gold Foil Print', price: '$65.00', tag: 'Spiritual', image: 'https://i.etsystatic.com/28222745/r/il/131566/3544809658/il_570xN.3544809658_5s82.jpg', rating: 5, badge: 'Hot' },
    { id: 302, category: 'temple-art-prints', name: 'Madhubani Durga Painting', price: '$89.00', tag: 'Folk Art', image: 'https://i.etsystatic.com/51892067/r/il/75614f/6749379437/il_340x270.6749379437_ibrn.jpg', rating: 5 },
    { id: 303, category: 'temple-art-prints', name: 'Lotus Mandala Wall Print', price: '$49.00', tag: 'Spiritual', image: 'https://www.divyanatur.com/cdn/shop/files/Tanjavur_big_temple_Art_8.jpg?v=1766956404', rating: 4 },
    { id: 304, category: 'temple-art-prints', name: 'Radha Krishna Pattachitra', price: '$120.00', tag: 'Handpainted', image: 'https://kotart.in/cdn/shop/files/CanvasAS35611.jpg?v=1697560772', rating: 5, badge: 'New' },
    { id: 305, category: 'temple-art-prints', name: 'Om Symbol Brass Emboss Print', price: '$75.00', tag: 'Premium', image: 'https://eurotex.in/cdn/shop/files/3x2feet-2-1.webp?v=1708169707', rating: 4 },
    { id: 306, category: 'temple-art-prints', name: 'Warli Tribal Art Canvas', price: '$55.00', tag: 'Folk Art', image: 'https://aesthesy.com/cdn/shop/files/Artboard2_1.jpg?v=1705822395&width=1500', rating: 4 },
    { id: 307, category: 'temple-art-prints', name: 'Tanjore Gold Lakshmi', price: '$195.00', tag: 'Tanjore', image: 'https://harmonyarts.com/cdn/shop/products/APS915_2.jpg?v=1625556929', rating: 5 },
    { id: 308, category: 'temple-art-prints', name: 'Buddha Serenity Zen Print', price: '$58.00', tag: 'Zen', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_uX5ThwGj43QMhcSwJMrgBEcALuJP7LHXvA&s', rating: 4 },
    { id: 309, category: 'temple-art-prints', name: 'Kalamkari Krishna Flute', price: '$88.00', tag: 'Kalamkari', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2l5F80h9MWyUgETkihSPZMWcRXm26mGjU9Q&s', rating: 5 },
  ];
  
  // ─── 4. Wall Murals ────────────────────────────────────────────────────────────
  const wallMurals: CategoryProduct[] = [
    { id: 401, category: 'wall-murals', name: 'Tropical Jungle Panorama Mural', price: '$245.00', tag: 'Bestseller', image: 'https://m.media-amazon.com/images/I/61UWPXQ4aqL._AC_UF1000,1000_QL80_.jpg', rating: 5, badge: 'Hot' },
    { id: 402, category: 'wall-murals', name: 'Marble Effect Full Wall Mural', price: '$189.00', tag: 'Luxury', image: 'https://5.imimg.com/data5/TB/KL/MY-58661806/fy.jpg', rating: 5 },
    { id: 403, category: 'wall-murals', name: 'Starry Night Galaxy Mural', price: '$210.00', tag: 'Dreamy', image: 'https://cdn.magicdecor.in/com/2023/11/06165639/3D-Elephant-Graffiti-Wall-Art-Wallpaper-Mural-M.jpg', rating: 4, badge: 'New' },
    { id: 404, category: 'wall-murals', name: 'Cityscape Skyline at Dusk', price: '$167.00', tag: 'Urban', image: 'https://homedecoram.com/cdn/shop/files/Newfloral4_533x.jpg?v=1697906949', rating: 4 },
    { id: 405, category: 'wall-murals', name: 'Cherry Blossom Forest Mural', price: '$198.00', tag: 'Nature', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKxU-dVvmIYM0tkIXSXki3iuzG1-bBk5Y_MA&s', rating: 5 },
    { id: 406, category: 'wall-murals', name: 'Ocean Underwater World Mural', price: '$225.00', tag: 'Nature', image: 'https://images.jdmagicbox.com/quickquotes/images_main/3d-mural-wallpaper-2217684910-037yzshl.jpg', rating: 4 },
    { id: 407, category: 'wall-murals', name: 'Abstract Geometric Mural', price: '$145.00', tag: 'Modern', image: 'https://cdn.shopify.com/s/files/1/0743/6487/9127/files/3D_Wall_Murals_for_Living_Room_1024x1024.jpg?v=1742818724', rating: 4 },
    { id: 408, category: 'wall-murals', name: 'Mountain Sunrise Panorama', price: '$178.00', tag: 'Sale', image: 'https://img.staticmb.com/mbcontent/images/uploads/2025/5/running-horse.jpg', rating: 3, badge: 'Sale' },
    { id: 409, category: 'wall-murals', name: 'Vintage World Map Mural', price: '$155.00', tag: 'Vintage', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpa6u4ekTeIVUKvbgmv75KbWD8iTtUHsWR-A&s', rating: 4 },
  ];
  
  // ─── 5. Modern Wallpapers ──────────────────────────────────────────────────────
  const modernWallpapers: CategoryProduct[] = [
    { id: 501, category: 'modern-wallpapers', name: 'Herringbone Textured Wallpaper', price: '$38.00', tag: 'Per Roll', image: 'https://cdn.magicdecor.in/com/2024/02/03153032/tropical-serenade-mockup-710x488.jpg', rating: 5 },
    { id: 502, category: 'modern-wallpapers', name: 'Blush Floral Boho Wallpaper', price: '$42.00', tag: 'Per Roll', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBz9gP68kKhnG-cUsmeH-tI2byREZcjeAnOA&s', rating: 4, badge: 'New' },
    { id: 503, category: 'modern-wallpapers', name: 'Dark Moody Botanical Print', price: '$55.00', tag: 'Premium', image: 'https://m.media-amazon.com/images/I/71U+96QMqFL.jpg', rating: 5, badge: 'Hot' },
    { id: 504, category: 'modern-wallpapers', name: 'Concrete Industrial Wallpaper', price: '$29.00', tag: 'Per Roll', image: 'https://m.media-amazon.com/images/I/712T9kev8lL._AC_UF1000,1000_QL80_.jpg', rating: 3 },
    { id: 505, category: 'modern-wallpapers', name: 'Gold Geometric Repeat Pattern', price: '$65.00', tag: 'Luxury', image: 'https://sc04.alicdn.com/kf/H002ff068a1234854a0c72554dbaea859w.jpg', rating: 5 },
    { id: 506, category: 'modern-wallpapers', name: 'Soft Pastel Watercolour Wash', price: '$44.00', tag: 'Bedroom', image: 'https://anaydecor.com/wp-content/uploads/2025/02/ADCW-194-1-3D-abstract-hexagon-in-golden-and-white-colors-A-elegant-seamless-texture-wallpaper-featuring-polygons-triangles-geometric-patterns-honeycombs-and-hexagons.jpg', rating: 4 },
    { id: 507, category: 'modern-wallpapers', name: 'Navy Blue Chinoiserie Toile', price: '$58.00', tag: 'Classic', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRym4UuGCKhmps7b3AElzQYVon2wJ6kflZ7EA&s', rating: 4 },
    { id: 508, category: 'modern-wallpapers', name: 'Terrazzo Stone Effect Paper', price: '$36.00', tag: 'Sale', image: 'https://lifencolors.in/cdn/shop/files/Rhythms_wallpaper_green_color_render2.webp?v=1753691780', rating: 3, badge: 'Sale' },
    { id: 509, category: 'modern-wallpapers', name: 'Lush Green Tropical Leaves', price: '$48.00', tag: 'Bestseller', image: 'https://i.etsystatic.com/25404343/r/il/73aa7e/3152176096/il_570xN.3152176096_791r.jpg', rating: 5 },
  ];
  
  // ─── 6. Customize Blinds ──────────────────────────────────────────────────────
  const customizeBlinds: CategoryProduct[] = [
    { id: 601, category: 'customize-blinds', name: 'Bamboo Roman Shade — Custom', price: '$120.00', tag: 'Custom', image: 'https://5.imimg.com/data5/GI/TI/ZG/SELLER-67871809/customized-roller-blinds-500x500.jpg', rating: 5, badge: 'New' },
    { id: 602, category: 'customize-blinds', name: 'Blackout Roller Blind White', price: '$89.00', tag: 'Blackout', image: 'https://m.media-amazon.com/images/I/710pBCjNoZL._AC_UF894,1000_QL80_.jpg', rating: 5 },
    { id: 603, category: 'customize-blinds', name: 'Wooden Venetian Slat Blind', price: '$145.00', tag: 'Wood', image: 'https://www.curtainlabel.com/wp-content/uploads/2022/09/Untitled-design-20.png', rating: 4 },
    { id: 604, category: 'customize-blinds', name: 'Sheer Linen Roman Blind', price: '$98.00', tag: 'Sheer', image: 'https://cdn.magicdecor.in/com/2023/11/25141426/Vintage-Art-Deco-Pattern-Roller-Blinds-for-Windows-2-710x488.jpg', rating: 4, badge: 'Hot' },
    { id: 605, category: 'customize-blinds', name: 'Printed Floral Roller Blind', price: '$78.00', tag: 'Printed', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTJl0tDMavIrGJiy1npriW-bDxdg2f9v1uGw&s', rating: 4 },
    { id: 606, category: 'customize-blinds', name: 'Day-Night Zebra Blind', price: '$110.00', tag: 'Day/Night', image: 'https://thepanipathandloom.com/media/user_84/1649487803_SDM1528.webp', rating: 5 },
    { id: 607, category: 'customize-blinds', name: 'Motorised Smart Blind', price: '$285.00', tag: 'Smart', image: 'https://s.alicdn.com/@sc04/kf/Hc9106ea4690441969b80ffb3525d01a57/Shangri-la-Blinds-Aluminum-Track-Dream-Like-Fabric-Curtain-Graceful-Fancy-Blind-Luxury-Dream-Curtain-Motorized-Vertical-Blinds.jpg', rating: 5 },
    { id: 608, category: 'customize-blinds', name: 'Cellular Honeycomb Blind', price: '$135.00', tag: 'Insulating', image: 'https://cdn.magicdecor.in/com/2023/11/25153331/Elegant-Green-Flower-Pattern-Roller-Blinds-for-Windows-2-710x488.jpg', rating: 4, badge: 'Sale' },
    { id: 609, category: 'customize-blinds', name: 'Vertical Fabric Panel Blind', price: '$92.00', tag: 'Office', image: 'https://5.imimg.com/data5/QO/CM/MY-3758929/printed.jpg', rating: 3 },
  ];
  
  // ─── 7. Neon Signs ─────────────────────────────────────────────────────────────
  const neonSigns: CategoryProduct[] = [
    { id: 701, category: 'neon-signs', name: '"Good Vibes Only" Neon Sign', price: '$165.00', tag: 'Bestseller', image: 'https://m.media-amazon.com/images/I/71Yk+dSsIgL._AC_UF894,1000_QL80_.jpg', rating: 5, badge: 'Hot' },
    { id: 702, category: 'neon-signs', name: 'Custom Name Neon in Pink', price: '$199.00', tag: 'Custom', image: 'https://cdn.neonchamp.in/media/catalog/product/cache/28e3a3f8247638249414b8879eeb6f24/c/u/custom-neon.png', rating: 5 },
    { id: 703, category: 'neon-signs', name: '"Open" Business LED Neon', price: '$89.00', tag: 'Commercial', image: 'https://www.aoos.com/cdn/shop/products/Good_Vibes_Neon_Sign_R559_8cebccbc-3488-4224-9816-03cdb3c5bd39.jpg?v=1691673897', rating: 4, badge: 'New' },
    { id: 704, category: 'neon-signs', name: 'Heart Shape Neon — Rose Gold', price: '$125.00', tag: 'Décor', image: 'https://thesevencolours.com/cdn/shop/files/better_together_wall_Neon_art_sign_LED_strip_Custom_Neon_Sign_Customized_Neon_Light_Wall_Decor_Gifting.jpg?v=1735204612', rating: 5 },
    { id: 705, category: 'neon-signs', name: '"Hustle" Motivational Neon', price: '$148.00', tag: 'Office', image: 'https://img.freepik.com/free-vector/welcome-neon-sign-vector_53876-76088.jpg?semt=ais_hybrid&w=740&q=80', rating: 4 },
    { id: 706, category: 'neon-signs', name: 'Flamingo Tropical Neon Sign', price: '$178.00', tag: 'Trendy', image: 'https://letscustom.in/cdn/shop/files/il_794xN.4530960404_j2c7_cleanup_1.png?v=1686722651', rating: 4 },
    { id: 707, category: 'neon-signs', name: 'Moon & Stars Bedroom Neon', price: '$139.00', tag: 'Kids', image: 'https://img4.dhresource.com/webp/m/0x0/f3/albu/ys/m/26/fc48872f-573f-4d66-9135-5bcc5f150cca.jpg', rating: 5 },
    { id: 708, category: 'neon-signs', name: 'Logo Custom Neon Business', price: '$299.00', tag: 'Custom', image: 'https://www.neonmantra.in/cdn/shop/files/Untitleddesign_1_767c447b-a8ab-4205-84b1-b50230f60066.png?v=1728544713', rating: 5 },
    { id: 709, category: 'neon-signs', name: '"Eat Drink Be Merry" Kitchen', price: '$155.00', tag: 'Sale', image: 'https://img.freepik.com/free-vector/neon-sale-sign_52683-71855.jpg', rating: 3, badge: 'Sale' },
  ];
  
  // ─── 8. Backlit LED ────────────────────────────────────────────────────────────
  const backlitLed: CategoryProduct[] = [
    { id: 801, category: 'backlit-led', name: 'LED Backlit Canvas Art Panel', price: '$215.00', tag: 'Premium', image: 'https://imgs.search.brave.com/o4UFan2PPv6XEomubML6nUUqDOQj1XUu3vZ4a-RBRh8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMueW91cnByaW50/LmluL25ldy1hZG1p/bi1hamF4LnBocD9h/Y3Rpb249cmVzaXpl/X291dGVyX2ltYWdl/JmNmY2FjaGU9YWxs/JnVybD1tZWRzMy9k/LWktby9BY3J5bGlj/X0ZyYW1lL0xlZC9h/Y3J5bGljX2xlZF9y/ZWN0X2QxMV9vLmpw/ZyZyZXNpemVUbz00/NTAmZm9ybWF0PXdl/YnA', rating: 5, badge: 'New' },
    { id: 802, category: 'backlit-led', name: 'RGB Backlit Mirror Frame', price: '$189.00', tag: 'Smart', image: 'https://imgs.search.brave.com/nX82_pqd5mePnY38sEl719LeNT6nQgPbCeaFGUgRhUg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLmV0/c3lzdGF0aWMuY29t/LzI4OTkxNDEzL2Mv/MjI1MC8yMjUwLzM5/OC8wL2lsL2UzY2Yw/Ni80Mzk1NDU0OTQ1/L2lsXzYwMHg2MDAu/NDM5NTQ1NDk0NV9r/dXVnLmpwZw', rating: 5 },
    { id: 803, category: 'backlit-led', name: 'Floating LED Wall Shelf', price: '$145.00', tag: 'Furniture', image: 'https://imgs.search.brave.com/q5AEuB1zTZjS_w5DWITTJSxU_uvHEJrnHneyIuEWYXU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLmV0/c3lzdGF0aWMuY29t/LzU1OTY4MzMwL3Iv/aWwvZTNlZDgyLzc2/MTA4Njk3MDQvaWxf/MzAweDMwMC43NjEw/ODY5NzA0X2EwdXgu/anBn', rating: 4, badge: 'Hot' },
    { id: 804, category: 'backlit-led', name: 'LED Galaxy Projector Panel', price: '$98.00', tag: 'Ambience', image: 'https://imgs.search.brave.com/DH1UK5syN8MuzSK78s-YwqAJ7F9PsIXdA_F_seJcwEs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NjFtSTloQkkxTkwu/anBn', rating: 4 },
    { id: 805, category: 'backlit-led', name: 'Backlit Periodic Table Art', price: '$165.00', tag: 'Educational', image: 'https://imgs.search.brave.com/MmnAjc_x2EAa8Y9JGdoxaMTzfz5Sa2SHzb2yejuVXmQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzFyOERxLUc4Vkwu/anBn', rating: 4 },
    { id: 806, category: 'backlit-led', name: 'Edge-Lit LED Glass Panel', price: '$245.00', tag: 'Luxury', image: 'https://imgs.search.brave.com/d0f1uzoRw1wqv_C8UtqvBnqIX-_VbqluQsanlD0RHw4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMueW91cnByaW50/LmluL25ldy1hZG1p/bi1hamF4LnBocD9h/Y3Rpb249cmVzaXpl/X291dGVyX2ltYWdl/JmNmY2FjaGU9YWxs/JnVybD1tZWRzMy9k/LWktby9BY3J5bGlj/X0ZyYW1lL0xlZC9h/Y3J5bGljX2xlZF9y/ZWN0X2QyNF9vLmpw/ZyZyZXNpemVUbz00/NTAmZm9ybWF0PXdl/YnA', rating: 5 },
    { id: 807, category: 'backlit-led', name: 'Sunrise Alarm LED Light Panel', price: '$79.00', tag: 'Wellness', image: 'https://imgs.search.brave.com/bcQ2lU_cDdQZpB2uqcGIfyTETs1n0cIcAjQW9Q9c-m8/rs:fit:0:180:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtZXUuc3NsLWlt/YWdlcy1hbWF6b24u/Y29tL2ltYWdlcy9J/LzgxbmNIRlpMM1VM/Ll9BQ19VTDE2NV9T/UjE2NSwxNjVfLmpw/Zw', rating: 4 },
    { id: 808, category: 'backlit-led', name: 'LED Word Art — Motivational', price: '$110.00', tag: 'Sale', image: 'https://imgs.search.brave.com/VjbTCfW0qBYmF7YJGSii7y3fXJygYhzfKm20FAnaN_k/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS53YWxsbWFudHJh/LmNvbS9wcm9kdWN0/L290aGVyL3dhbGxt/YW50cmEtY2hpcnBp/bmctYmlyZHMtcm91/bmQtbGVkLWFjcnls/aWMtd2FsbC1saWdo/dC0yQzFDLW1lZGl1/bS53ZWJw', rating: 3, badge: 'Sale' },
    { id: 809, category: 'backlit-led', name: 'Backlit City Map LED Panel', price: '$198.00', tag: 'Bestseller', image: 'https://imgs.search.brave.com/d71VfiCDm2ZZcos7s_0MpqYPP_9ALLqQxNRdtLBlEPU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS53YWxsbWFudHJh/LmNvbS9wcm9kdWN0/L290aGVyL3dhbGxt/YW50cmEtcmVpbmRl/ZXItZGVzaWduZXIt/d29vZGVuLWJhY2ts/aXQtYWNyeWxpYy13/YWxsLWFydC1FMEM3/LW1lZGl1bS53ZWJw', rating: 5 },
  ];
  
  // =============================================================================
  //  CATEGORY CONFIG MAP
  // =============================================================================
  export const CATEGORIES: Record<string, CategoryConfig> = {
    'portrait-frames': {
      slug: 'portrait-frames',
      name: 'Ghee & Dairy',
      tagline: 'Frame Every Precious Memory',
      description: 'Handcrafted and precision-made frames for every style — from ornate baroque gold to clean Scandinavian minimalism. Each frame is built to preserve your most cherished moments for generations.',
      heroImage: 'https://images.unsplash.com/photo-1582131503261-fca1d1c0589f?w=1400&q=85',
      accent: GHEE_DAIRY,
      accentLight: '#F8EED6',
      icon: '🖼️',
      filterTags: ['Gold', 'Black', 'Silver', 'Rustic', 'Minimalist', 'Ornate'],
      products: portraitFrames,
    },
    'canvas-paintings': {
      slug: 'canvas-paintings',
      name: 'Atta & Grains',
      tagline: 'Original Art for Every Wall',
      description: 'From hand-painted originals to museum-quality prints, our canvas collection transforms blank walls into personal galleries. Each piece tells a story.',
      heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1400&q=85',
      accent: ATTA_GRAINS,
      accentLight: '#EFE8DF',
      icon: '🎨',
      filterTags: ['Abstract', 'Landscape', 'Floral', 'Geometric', 'Portrait', 'Oil'],
      products: canvasPaintings,
    },
    'temple-art-prints': {
      slug: 'temple-art-prints',
      name: 'Natural Sweeteners',
      tagline: 'Sacred Art, Timeless Devotion',
      description: 'Authentic Indian temple art — Tanjore, Madhubani, Pattachitra, Kalamkari and more. Bring divine blessings and cultural heritage into your home with museum-quality prints.',
      heroImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=85',
      accent: NATURAL_SWEETENERS,
      accentLight: '#F4EBDD',
      icon: '🪔',
      filterTags: ['Ganesha', 'Lakshmi', 'Krishna', 'Buddha', 'Mandala', 'Tanjore'],
      products: templeArtPrints,
    },
    'wall-murals': {
      slug: 'wall-murals',
      name: 'Snacks',
      tagline: 'Transform Your Room Entirely',
      description: 'Floor-to-ceiling statement murals that redefine any room. Easy-install, peel-and-stick wallpaper murals in hundreds of stunning designs — no professional required.',
      heroImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1400&q=85',
      accent: SNACKS,
      accentLight: '#E7E8E7',
      icon: '🌿',
      filterTags: ['Nature', 'Urban', 'Abstract', 'Tropical', 'Galaxy', 'Vintage'],
      products: wallMurals,
    },
    'modern-wallpapers': {
      slug: 'modern-wallpapers',
      name: 'Modern Wallpapers',
      tagline: 'Layer Your Walls with Personality',
      description: 'Contemporary wallpaper designs that go beyond plain paint. Whether you prefer bold prints or subtle textures, our curated collection has the perfect pattern to define your space.',
      heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=85',
      accent: '#C0647A',
      accentLight: '#fdf1f3',
      icon: '🌸',
      filterTags: ['Textured', 'Floral', 'Geometric', 'Botanical', 'Metallic', 'Neutral'],
      products: modernWallpapers,
    },
    'customize-blinds': {
      slug: 'customize-blinds',
      name: 'Customize Blinds',
      tagline: 'Light Control, Your Way',
      description: 'Custom-cut window blinds made to your exact measurements. Choose from roller, roman, venetian, or motorised smart blinds in hundreds of fabrics and finishes.',
      heroImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85',
      accent: '#5B7FA6',
      accentLight: '#f0f5fa',
      icon: '🪟',
      filterTags: ['Blackout', 'Sheer', 'Bamboo', 'Motorised', 'Roman', 'Venetian'],
      products: customizeBlinds,
    },
    'neon-signs': {
      slug: 'neon-signs',
      name: 'Neon Signs',
      tagline: 'Light Up Your World',
      description: 'Custom LED neon signs for homes, businesses, events, and gifting. Handcrafted with energy-efficient LED flex tubing — vibrant, dimmable, and built to last 50,000+ hours.',
      heroImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1400&q=85',
      accent: '#FF3CAC',
      accentLight: '#fff0f8',
      icon: '💡',
      filterTags: ['Custom', 'Quote', 'Heart', 'Business', 'Kids', 'Wedding'],
      products: neonSigns,
    },
    'backlit-led': {
      slug: 'backlit-led',
      name: 'Backlit LED',
      tagline: 'Art That Glows',
      description: 'Next-generation LED backlit panels that fuse art with ambient lighting. Perfect for accent walls, gaming rooms, offices, and anywhere you want dramatic atmosphere.',
      heroImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1400&q=85',
      accent: '#00C9FF',
      accentLight: '#f0fbff',
      icon: '✨',
      filterTags: ['Canvas', 'Mirror', 'Shelf', 'Galaxy', 'Smart', 'Luxury'],
      products: backlitLed,
    },
  };
  
  export const getCategoryConfig = (slug: string): CategoryConfig | undefined =>
    CATEGORIES[slug];