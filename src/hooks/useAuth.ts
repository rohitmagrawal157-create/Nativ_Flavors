// src/hooks/useAuth.ts
import { useCallback, useEffect, useState } from 'react';

export interface AuthUser { id:string; name:string; email:string; phone?:string; }

export function useAuth() {
  const [user,setUser]=useState<AuthUser|null>(null);
  const [loading,setLoading]=useState(true);
  const refresh=useCallback(()=>{
    try{const t=localStorage.getItem('access_token');const r=localStorage.getItem('auth_user');if(t&&r)setUser(JSON.parse(r));else setUser(null);}
    catch{setUser(null);}finally{setLoading(false);}
  },[]);
  useEffect(()=>{refresh();const h=(e:StorageEvent)=>{if(e.key==='access_token'||e.key==='auth_user')refresh();};window.addEventListener('storage',h);return()=>window.removeEventListener('storage',h);},[refresh]);
  return{user,isAuth:!!user,loading,refresh};
}

export interface OrderLine{productId:number;productName:string;image:string;price:number;mrp:number;quantity:number;tag?:string;}
export type OrderStatus='Pending'|'Confirmed'|'Shipped'|'Completed'|'Cancelled';
export interface Order{id:string;userId:string;createdAt:string;lines:OrderLine[];subtotal:number;shipping:number;platformFee:number;couponCode?:string;couponDiscount:number;total:number;paymentMethod:'cod'|'card'|'razorpay';paymentId?:string;status:OrderStatus;billingAddress:{fullName:string;email:string;phone:string;addressLine1:string;addressLine2:string;city:string;pincode:string;additionalText?:string;};}

const KEY='app_orders';
export function getStoredOrders():Order[]{try{return JSON.parse(localStorage.getItem(KEY)??'[]');}catch{return[];}}
export function saveOrder(o:Order):void{const arr=getStoredOrders();arr.unshift(o);localStorage.setItem(KEY,JSON.stringify(arr));window.dispatchEvent(new Event('orders:changed'));}
export function getOrdersForUser(uid:string):Order[]{return getStoredOrders().filter(o=>o.userId===uid);}
export function generateOrderId():string{return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;}