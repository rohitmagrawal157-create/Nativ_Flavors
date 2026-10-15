# Quick Testing Guide for ProductDetails Refactoring

## 1. Start the Development Server

```bash
cd "/Users/invictusmac/Documents/Home Decor/Furnixar_ReactJs_v1.3.0/Furnixar_ReactJs (Typescript)"
npm run dev
```

The app will be available at `http://localhost:5173` (or the configured port).

## 2. Test Search Bar (Fixed)

- Go to `/shop-v1` or use the search functionality
- Search for a product by name
- Verify results appear (should use backend search, fallback to local filtering if needed)
- Check that search results are properly mapped with images, prices, and names

## 3. Test Product Details Page

### Basic Rendering
1. Click on any product to go to product details page
2. Verify page loads without errors
3. Check breadcrumb: Home > Shop > Product Name

### Gallery & Zoom
1. **Hover zoom** - Move mouse over main image, should see zoomed lens following cursor
2. **Click to fullscreen** - Click main image to open lightbox
3. **Lightbox navigation** - Use arrow keys or buttons to navigate images
4. **Press Escape** to close lightbox
5. **Thumbnail strip** - Click thumbnails to change main image
6. **Thumbnail auto-scroll** - Should scroll to active thumbnail when using arrows

### Header Section
1. **Product Title** - Should display at top
2. **Share Icon** (top right) - Click to open dropdown with Facebook, Twitter, Pinterest, WhatsApp
3. **Wishlist Icon** (top right) - Click to toggle, should show heart filled/unfilled
4. **Rating & Reviews Link** - Click to scroll to reviews section
5. **Stock Indicator** - Shows status (In Stock, Low Stock, Out of Stock) with colored bar
6. **Price Display** - Shows current price in INR with gradient text, original price struck through, discount percentage

### Countdown Timer
1. **Sale Timer** - Should show Days:Hours:Minutes:Seconds counting down
2. **Update frequency** - Timer should update every second

### Accordions Section
1. **Description** - Should be OPEN by default with product description
2. **Features** - Should be OPEN by default with feature list
3. **Size & Detail** - Should be OPEN by default with specifications
4. **Returns** - Should be COLLAPSED (closed by default)
5. **Care Instructions** - Should be COLLAPSED
6. **Shipping** - Should be COLLAPSED
7. **Click titles** - Should expand/collapse smoothly

### Size & Color Selection
1. **Sizes** - Should show S, M, L, XL as radio buttons
2. **Colors** - Should show available color options
3. **Size Guide Link** - Click to open modal with measurements
4. **Size Guide Modal** - Should show table with size dimensions

### Delivery Info
1. **Estimated Delivery** - Shows date range (e.g., "21 Apr – 25 Apr")
2. **Delivery Features Strip** - Shows:
   - Free Shipping (On orders above ₹999)
   - 7-Day Returns
   - Secure Payments
   - Cash on Delivery
3. **Pincode Checker** - Enter a 6-digit pincode and click Check
   - If starts with 3+ → "✓ Delivery available by [date]"
   - If starts with 1-2 → "✗ Delivery not available"

### Cart Operations

#### Add to Cart (Authenticated User)
1. Set quantity with +/- buttons or type number
2. Click **Add to Cart** button
3. Should see ✅ success toast: "Added X item(s) to cart"
4. Button should show "Adding..." state during operation

#### Add to Cart (Not Authenticated)
1. Make sure you're logged out
2. Try to add to cart
3. Should see ⚠️ warning toast: "Please sign in to add items to cart"
4. Should redirect to login page with return URL

#### Out of Stock
1. Navigate to an out-of-stock product (if available)
2. Stock indicator shows "Out of Stock" with red status
3. Quantity selector disabled
4. **Add to Cart button disabled** (grayed out)
5. **Out of Stock Panel** shows with email notification signup
6. Can enter email and click "Notify Me"

### Wishlist
1. **Click heart icon** near title
2. Should see 💚 success toast: "Added to wishlist" or "Removed from wishlist"
3. Heart should fill/unfill visually
4. Loading spinner appears during toggle

### Bulk Order Link
1. Should display "Want to buy in bulk? Chat with us"
2. Click link should open WhatsApp with pre-filled message about bulk purchase

### Reviews Section
1. **Scroll down** to see "Customer Reviews" section
2. **Rating Summary** shows:
   - Star rating (e.g., 4.8)
   - Total reviews count
   - Rating breakdown (5 star 76%, 4 star 16%, etc.)
3. **Write a Review** button
4. **Expand form** - Click button to show review form
5. **Form fields**:
   - Your name (optional)
   - Rating (1-5 stars)
   - Title (optional)
   - Body (required)
6. **Submit** - Click "Post Review" to submit
   - Should show "Posting..." state
   - Review should appear at top of list on success
7. **Delete** - Click delete button on your review (if authenticated)
8. **Review Cards** show:
   - Avatar with initials
   - Name
   - Rating with stars
   - "✓ Verified" badge
   - Date
   - Title and body
   - Helpful? Yes/No buttons
   - Delete option (if authenticated)

### Related Products
1. **Scroll to bottom** of page
2. Should show "Related Products" grid
3. Display 4 products in 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
4. Each product card clickable to navigate to that product

## 4. Toast Notifications Test

### Success Toast (Green)
- Add to cart ✅
- Add to wishlist ✅
- Add review ✅

### Error Toast (Red)
- Failed API call
- Invalid form submission
- Cart operation failed

### Warning Toast (Yellow)
- Not authenticated before add to cart
- Delivery not available for pincode

### Info Toast (Blue)
- Informational messages

**Expected behavior:**
- Appears at bottom-right corner
- Auto-dismisses after 2-3 seconds
- Has close button
- Shows appropriate icon

## 5. Responsive Testing

### Mobile (< 640px)
- Gallery full width on top
- Info stacks below
- Single column layout
- Accordions function properly
- Touch-friendly buttons

### Tablet (640px - 1024px)
- Gallery and info side-by-side if screen allows
- Proper spacing maintained
- All features accessible

### Desktop (> 1024px)
- Gallery 58% width on left
- Info section 40% width on right
- Full feature accessibility
- Smooth animations

## 6. Performance Checks

- **Page load time** - Should load product within 2-3 seconds
- **Image loading** - Should lazy-load thumbnails and use responsive images
- **Zoom performance** - Smooth zooming without lag (GPU accelerated)
- **Animations** - Smooth transitions and no jank

## 7. Known Issues to Check

None reported - everything should work smoothly!

## Success Criteria

✅ All components render correctly  
✅ Search bar works with fallback  
✅ Toast notifications appear for all actions  
✅ Cart API calls check auth before proceeding  
✅ Accordions open/close properly with correct defaults  
✅ Zoom feature is smooth and responsive  
✅ Share and wishlist icons work inline  
✅ Mobile/tablet/desktop layouts responsive  
✅ No TypeScript errors in production build  

---

**Happy Testing!** 🚀
