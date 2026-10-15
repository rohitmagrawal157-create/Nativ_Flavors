'use client'


import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'

import seller2 from '../../assets/img/home-v4/seller-02.jpg'

import { productList } from '../../data/data'

import { GoStarFill } from 'react-icons/go'
import { LuEye, LuHeart } from 'react-icons/lu'
import { RiShoppingBag2Line } from 'react-icons/ri'
import { addToCart } from '../../api/cart.api'
import { isWishlistedAsync, toggleWishlist } from '../../api/wishlist.api'

interface ProductData{
    id: number;
    image: string;
    tag: string;
    price: string;
    name: string;
}

export default function BestSeller() {
    const [activeTab, setActiveTab] = useState<number>(1)
    const [busy, setBusy] = useState<null | { type: 'cart' | 'wishlist'; productId: number }>(null)
    const [notice, setNotice] = useState<null | { productId: number; message: string }>(null)
    const [wishedMap, setWishedMap] = useState<Record<number, boolean>>({})

    useEffect(() => {
      // Only load for cards we render in this component (first 4 items).
    const ids = productList.slice(0, 4).map((p) => p.id)
    Promise.all(ids.map((id) => isWishlistedAsync(id).then((v) => ({ id, v })).catch(() => ({ id, v: false })))).then((rows) => {
          setWishedMap((prev) => {
            const next = { ...prev }
            rows.forEach(({ id, v }) => {
              next[id] = v
            })
            return next
          })
        })
        .catch(() => {
          // ignore
        })
    }, [])

    const onAddToCart = async (productId: number) => {
      if (busy) return
      setBusy({ type: 'cart', productId })
      setNotice(null)
      try {
        await addToCart(productId, 1)
        setNotice({ productId, message: 'Added to cart' })
        window.setTimeout(() => setNotice(null), 2200)
      } catch {
        setNotice({ productId, message: 'Add to cart failed' })
        window.setTimeout(() => setNotice(null), 2500)
      } finally {
        setBusy(null)
      }
    }

    const onToggleWishlist = async (productId: number) => {
      if (busy) return
      setBusy({ type: 'wishlist', productId })
      setNotice(null)
      try {
        const next = await toggleWishlist(productId)
        const nowWished = next.productIds.includes(productId)
        setWishedMap((prev) => ({ ...prev, [productId]: nowWished }))
        setNotice({ productId, message: nowWished ? 'Wishlisted' : 'Removed from wishlist' })
        window.setTimeout(() => setNotice(null), 2200)
      } catch {
        setNotice({ productId, message: 'Wishlist action failed' })
        window.setTimeout(() => setNotice(null), 2500)
      } finally {
        setBusy(null)
      }
    }

  return (
    <div className="max-w-1366 mx-auto">
        <div className="flex items-center justify-between gap-5 flex-wrap mb-6 pb-4 md:pb-6 border-b border-bdr-clr dark:border-bdr-clr-drk">
            <h2 className="font-semibold leading-none text-2xl sm:text-3xl lg:text-4xl">Best Sellers</h2>
            <div className="best-seller-btn flex gap-4 sm:gap-6 flex-wrap">
                <button className={`sm:text-lg leading-none sm:leading-none text-title dark:text-white font-medium ${activeTab === 1 ? 'active' : ''}`} onClick={()=>setActiveTab(1)}>
                    <span>Day</span>
                </button>
                <button className={`sm:text-lg leading-none sm:leading-none text-title dark:text-white font-medium ${activeTab === 2 ? 'active' : ''}`} onClick={()=>setActiveTab(2)}>
                    <span>Week</span>
                </button>
                <button className={`sm:text-lg leading-none sm:leading-none text-title dark:text-white font-medium ${activeTab === 3 ? 'active' : ''}`} onClick={()=>setActiveTab(3)}>
                    <span>Month</span>
                </button>
            </div>
        </div>
        <div className="mt-5">
            {activeTab === 1 && 
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
                        {productList.slice(0,4).map((item:ProductData,index:number)=>{
                            return(
                                <div className="" key={index}>
                                    <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                                        <img className="w-full transform duration-300 group-hover:scale-110" src={item.image} alt="product-card"/>
                                        <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                            <div>
                                                <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">{item.price}</h4>
                                                <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">{item.name}</Link></h6>
                                                <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-slate-300 size-4'/></li>
                                                    <li className="text-white">( 123 )</li>
                                                </ul>
                                                <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                                        <LuEye className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>                          
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => onAddToCart(item.id)}
                                                      disabled={busy?.type === 'cart'}
                                                      className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => onToggleWishlist(item.id)}
                                                      disabled={busy?.type === 'wishlist'}
                                                      className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <LuHeart className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                                          {wishedMap[item.id] ? 'Wishlisted' : 'Add to wishlist'}
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                </div>
                                                {notice?.productId === item.id && (
                                                  <p className="text-xs mt-3 text-white transition-opacity">{notice.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="grid grid-cols-1">
                        <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                            <img className="w-full transform duration-300 group-hover:scale-110 h-full" src={seller2} alt="product-card"/>
                            <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                <div>
                                    <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">$120</h4>
                                    <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">Fashionable Wooden Sofa</Link></h6>
                                    <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-slate-300 size-4'/></li>
                                        <li className="text-white">( 123 )</li>
                                    </ul>
                                    <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                            <LuEye className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>                          
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAddToCart(productList[0].id)}
                                            disabled={busy?.type === 'cart'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onToggleWishlist(productList[0].id)}
                                            disabled={busy?.type === 'wishlist'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <LuHeart className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                                {wishedMap[productList[0].id] ? 'Wishlisted' : 'Add to wishlist'}
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {activeTab === 2 && 
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
                        {productList.slice(0,2).map((item:ProductData,index:number)=>{
                            return(
                                <div className="" key={index}>
                                    <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                                        <img className="w-full transform duration-300 group-hover:scale-110" src={item.image} alt="product-card"/>
                                        <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                            <div>
                                                <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">{item.price}</h4>
                                                <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">{item.name}</Link></h6>
                                                <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-slate-300 size-4'/></li>
                                                    <li className="text-white">( 123 )</li>
                                                </ul>
                                                <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                                        <LuEye className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>                          
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => onAddToCart(item.id)}
                                                      disabled={busy?.type === 'cart'}
                                                      className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => onToggleWishlist(item.id)}
                                                      disabled={busy?.type === 'wishlist'}
                                                      className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <LuHeart className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                                          {wishedMap[item.id] ? 'Wishlisted' : 'Add to wishlist'}
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                </div>
                                                {notice?.productId === item.id && (
                                                  <p className="text-xs mt-3 text-white transition-opacity">{notice.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="grid grid-cols-1">
                        <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                            <img className="w-full transform duration-300 group-hover:scale-110 h-full" src={seller2} alt="product-card"/>
                            <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                <div>
                                    <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">$120</h4>
                                    <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">Fashionable Wooden Sofa</Link></h6>
                                    <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-slate-300 size-4'/></li>
                                        <li className="text-white">( 123 )</li>
                                    </ul>
                                    <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                            <LuEye className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>                          
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAddToCart(productList[0].id)}
                                            disabled={busy?.type === 'cart'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onToggleWishlist(productList[0].id)}
                                            disabled={busy?.type === 'wishlist'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <LuHeart className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                              {wishedMap[productList[0].id] ? 'Wishlisted' : 'Add to wishlist'}
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {activeTab === 3 && 
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                    <div className="grid grid-cols-1">
                        <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                            <img className="w-full transform duration-300 group-hover:scale-110 h-full" src={seller2} alt="product-card"/>
                            <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                <div>
                                    <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">$120</h4>
                                    <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">Fashionable Wooden Sofa</Link></h6>
                                    <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                        <li><GoStarFill className='text-slate-300 size-4'/></li>
                                        <li className="text-white">( 123 )</li>
                                    </ul>
                                    <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                            <LuEye className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>                          
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAddToCart(productList[0].id)}
                                            disabled={busy?.type === 'cart'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onToggleWishlist(productList[0].id)}
                                            disabled={busy?.type === 'wishlist'}
                                            className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <LuHeart className="transition-all duration-300 text-white size-6"/>
                                            <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                              {wishedMap[productList[0].id] ? 'Wishlisted' : 'Add to wishlist'}
                                                <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
                        {productList.slice(0,2).map((item:ProductData,index:number)=>{
                            return(
                                <div className="" key={index}>
                                    <div className="relative group z-[5] before:absolute card-gradient-overlay before:w-full before:h-full before:top-0 before:left-0 before:opacity-0 before:duration-300 before:z-[5] overflow-hidden hover:before:opacity-100 best-seller-pdct">
                                        <img className="w-full transform duration-300 group-hover:scale-110" src={item.image} alt="product-card"/>
                                        <div className="absolute z-10 top-0 left-0 w-full h-full items-start justify-end flex flex-col p-7">
                                            <div>
                                                <h4 className="text-lg font-medium leading-none text-white transition-all group-hover:duration-100 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">{item.price}</h4>
                                                <h6 className="sm:text-xl font-normal text-white transition-all group-hover:duration-300 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-lg mt-3 md:mt-[15px] !leading-[1.5]"><Link to="/product-details">{item.name}</Link></h6>
                                                <ul className="flex items-center gap-2 mt-1 transition-all group-hover:duration-500 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-yellow-500 size-4'/></li>
                                                    <li><GoStarFill className='text-slate-300 size-4'/></li>
                                                    <li className="text-white">( 123 )</li>
                                                </ul>
                                                <div className="mt-4 sm:mt-5 flex gap-[10px] transition-all group-hover:duration-700 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <button className="w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon quick-view">
                                                        <LuEye className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Quick View
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>                          
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onAddToCart(item.id)}
                                                        disabled={busy?.type === 'cart'}
                                                        className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'cart' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <RiShoppingBag2Line className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">Add to Cart
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleWishlist(item.id)}
                                                        disabled={busy?.type === 'wishlist'}
                                                        className={`w-9 lg:w-12 h-9 p-2 lg:h-12 flex items-center justify-center text-white  transition-all bg-white/20 duration-300 relative tooltip-icon ${busy?.type === 'wishlist' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <LuHeart className="transition-all duration-300 text-white size-6"/>
                                                        <span className="p-2 bg-white dark:bg-title text-xs text-title dark:text-white absolute -top-[60px] left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-[4px] opacity-0 invisible duration-300">
                                                          {wishedMap[item.id] ? 'Wishlisted' : 'Add to wishlist'}
                                                            <span className="w-3 h-3 bg-white dark:bg-title absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 rotate-45"></span>
                                                        </span>
                                                    </button>
                                                </div>
                                                {notice?.productId === item.id && (
                                                  <p className="text-xs mt-3 text-white transition-opacity">{notice.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    </div>
  )
}
