'use client'

import { useEffect } from "react";
import { Link } from '@/lib/router';

import image1 from '../../assets/img/thumb/coming-soon.png'
import image2 from '../../assets/img/shape/coming-soon-shape.png'
import logo from '../../assets/img/Native Flavour Logo-01.png'
import logoLight from '../../assets/img/Native Flavour Logo-01.png'
import bg from '../../assets/img/bg/coming-soon-bg.jpg'
import bg2 from '../../assets/img/thumb/coming-soon-shape.png'

import Switcher from "../../components/switcher";
import Aos from "aos";

export default function ComingSoon() {
    useEffect(() => {
        Aos.init({ duration: 400, once: true, easing: 'ease' })
    }, [])

  return (
    <>
        <div className="pt-8 sm:pt-12 relative z-10">
            <img className="absolute top-0 left-[5%] -z-10 w-[12%]" src={image1} alt="light" data-aos="fade-up" data-aos-delay="100"/>
            <img className="absolute bottom-0 right-0 w-1/4 -z-10" src={image2} alt="shape" data-aos="fade-up" data-aos-delay="100"/>
            <div className="container">
                <div className="text-center">
                    <Link className="cursor-pointer inline-block" to="/">
                      <img src={logo} alt="Native Flavours" className='dark:hidden h-14 w-14 object-contain' data-aos="fade-up" data-aos-delay="100"/> 
                      <img src={logoLight} alt="" className='dark:block hidden h-14 w-14 object-contain' data-aos="fade-up" data-aos-delay="100"/>  
                    </Link>
                </div>
                <div className="text-center py-16 sm:py-24 lg:py-[150px]">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-none" data-aos="fade-up" data-aos-delay="200">We are Coming Soon</h1>
                    <p className="max-w-[503px] mx-auto mt-3 sm:mt-6 text-base sm:text-lg" data-aos="fade-up" data-aos-delay="300">Our website is under construction.
                    We'll be here soon with our new awesome site.</p>
                    <p className="max-w-[503px] mx-auto mt-6 text-base" data-aos="fade-up">We will share it here when it is ready.</p>
                </div>
            </div>
        </div>
        <div className="coming-soon-footer py-12 sm:py-20 lg:py-28 bg-overlay relative z-20" style={{backgroundImage:`url(${bg})`}}>
          <img className="absolute bottom-10 right-0 w-[25%] hidden sm:block" src={bg2} alt="shape"/>
            <div className="container">
                <div className="flex items-center justify-center">
                    <div className="max-w-md">
                        <h2 className="font-bold leading-none dark:text-white" data-aos="fade-up" data-aos-delay="600">Subscribe to be Notified</h2>
                        <p className="mt-3 md:mt-5 dark:text-white-light" data-aos="fade-up" data-aos-delay="200">Stay updated with our latest news, tips, and exclusive offers! Subscribe to our newsletter and never miss out on what’s new. </p>
                        <div className="mt-4 lg:mt-6 sm:flex" data-aos="fade-up" data-aos-delay="300">
                            <input className="w-full h-12 md:h-14 bg-snow border dark:bg-snow dark:bg-opacity-5 border-title focus:border-primary border-opacity-10 duration-300 p-4 outline-none dark:text-white sm:flex-1 sm:border-r-0" type="text" placeholder="Enter your email address"/>
                            <button className="w-full h-12 bg-title text-white flex items-center justify-center text-base md:text-lg font-medium p-3 mt-3 sm:mt-0 sm:w-32 sm:h-auto sm:flex-none dark:bg-primary dark:text-title">Subscribe</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="switcher z-20 w-12 sm:w-[60px] h-12 sm:h-[60px] fixed bottom-[10px] md:bottom-5 left-[10px] md:left-5 rounded-xl flex items-center justify-center cursor-pointer">
            <Switcher/>
        </div>
    </>
  )
}
