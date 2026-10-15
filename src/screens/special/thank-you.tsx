'use client'

import { Link } from '@/lib/router';

import NavbarOne from "../../components/navbar/navbar-one";
import FooterOne from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";

export default function ThankYou() {
  return (
    <>
        <NavbarOne/>

        <div className="py-16 sm:py-24">
            <div className="container">
                <div className="max-w-[710px] mx-auto text-center p-7 sm:p-10 lg:p-12">
                    <div className="flex justify-center" aria-hidden="true">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                            <circle cx="60" cy="60" r="56" fill="#F6F3EE" stroke="#2F4A3A" strokeWidth="4"/>
                            <circle cx="60" cy="60" r="44" fill="#2F4A3A"/>
                            <path d="M40 61.5 53.5 75 81 46" stroke="#F6F3EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h3 className="leading-[1.2] mt-4 md:mt-6 text-2xl md:text-[32px] font-bold text-title dark:text-white">For Shopping with Furnixar</h3>
                    <p className="mt-3 text-base sm:text-lg text-paragraph dark:text-white">
                        Please Check your email for Download Invoice . Or <Link to="/" className="text-primary underline">Click here </Link>
                    </p>
                    <Link to="/" className='btn btn-solid mt-4 md:mt-6' data-text="Back to home">
                        <span>Back to home</span>
                    </Link>
                </div>
            </div>
        </div>
        
        <FooterOne/>

        <ScrollToTop/>
    </>
  )
}
