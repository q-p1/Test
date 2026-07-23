import { Suspense, lazy, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { SmoothScrollProvider } from './lib/smoothScroll';
import { CartProvider } from './lib/cart';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { SearchOverlay } from './components/layout/SearchOverlay';
import { FloatingCTA } from './components/layout/FloatingCTA';
import { Cursor } from './components/layout/Cursor';
import { ScrollProgress } from './components/layout/ScrollProgress';
import { PageTransition } from './components/layout/PageTransition';
import { RouteFallback } from './components/layout/RouteFallback';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const Checkout = lazy(() => import('./pages/Checkout'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <CartProvider>
      <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        {/* Skip link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-950 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
        >
          تخطَّ إلى المحتوى الرئيسي
        </a>

        <Cursor />
        <ScrollProgress />
        <AnnouncementBar />
        <Header onSearch={() => setSearchOpen(true)} />

        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </AnimatePresence>
        </Suspense>

        <Footer />

        <CartDrawer />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <FloatingCTA />
      </SmoothScrollProvider>
      </MotionConfig>
    </CartProvider>
  );
}
