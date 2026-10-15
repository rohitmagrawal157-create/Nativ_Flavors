# Infinity HomeDecor

Next.js storefront for Infinity HomeDecor: frames, canvas, temple art, murals, wallpapers, blinds, neon, and backlit LED.

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
```

`npm run dev` starts the Next.js dev server (webpack, so existing image imports keep working). Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-host/Shopping-Cart/public
NEXT_PUBLIC_RAZORPAY_KEY=
NEXT_PUBLIC_CART_SESSION_ID=
```

`NEXT_PUBLIC_API_BASE_URL` is optional. When it is missing, the app uses the Hostinger Shopping Cart API already wired through the project.

## Structure

- `app/` — Next.js App Router. Each route loads the matching screen from `src/screens`.
- `src/screens` — page screens (home, shop, product, account, blog, categories).
- `src/components` — navbar, footer, product blocks, and shared UI.
- `src/api` — auth, cart, wishlist, products, and orders.
- `src/lib/router.tsx` — `Link`, `useNavigate`, `useParams`, `useSearchParams`, and `useLocation` for the existing screens.
- `src/lib/env.ts` — API origin.

`/products` is the shop (including `?category=`). `/shop` redirects to `/shop-v1`. `/product/:id` redirects to `/product-details/:id`.
# Nativ_Flavors
