'use client'

import { Link } from '@/lib/router'

import logoLight from '../../assets/img/Native Flavour Logo-01.png'

import { footerLink1, footerLink2, footerLink3, footerLink4 } from '../../data/nav-data'

import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa'
import { FiLinkedin } from 'react-icons/fi'

interface LinkData{
    name: string;
    link: string;
}

export default function FooterFive() {
  return (
    <div className="py-[50px] border-b border-[#3A454F] flex items-start gap-10 justify-between flex-col xl:flex-row">
        <div className="max-w-md sm:mx-auto xl:mx-0 xl:max-w-[382px] w-full sm:text-center xl:text-left">
            <Link to="#">  
                <img src={logoLight} className="sm:mx-auto xl:mx-0 h-14 w-14 object-contain" alt="Native Flavours" />                                                      
            </Link>
            <p className="mt-[15px] text-white">Furnixar is a modern furniture template for an eCommerce website designed to help you create an impressive online store for your furniture. </p>
        </div>

        <div className="xl:max-w-[937px] w-full grid grid-cols-2 sm:grid-cols-3 lg:flex items-start justify-between gap-10">
            <div>
                <h4 className="leading-none mb-5 md:mb-6 text-xl text-white">Sitemap</h4>
                <ul className="text-white leading-none flex flex-col gap-4">
                    {footerLink1.map((item:LinkData,index:number)=>{
                        return(
                            <li className="duration-100 hover:text-primary inline-block group" key={index}><Link className="text-underline-primary" to={item.link}>{item.name}</Link></li>
                        )
                    })}
                </ul>
            </div>
        
            <div>
                <h4 className="leading-none mb-5 md:mb-6 text-xl text-white">Others</h4>
                <ul className="text-white leading-none flex flex-col gap-4">
                    {footerLink2.map((item:LinkData,index:number)=>{
                        return(
                            <li className="duration-100 hover:text-primary inline-block group" key={index}><Link className="text-underline-primary" to={item.link}>{item.name}</Link></li>
                        )
                    })}
                </ul>
            </div>
        
            <div>
                <h4 className="leading-none mb-5 md:mb-6 text-xl text-white">Social Media</h4>
                <ul className="text-white leading-none flex flex-col gap-4">
                    <li className="duration-100 hover:text-primary inline-block group"><Link className="gap-3 flex items-center" to="#">
                        <FaFacebookF className=" text-white duration-300 group-hover:text-primary"/>                                 
                        Facebook
                    </Link></li>
                    <li className="duration-100 hover:text-primary inline-block group"><Link className="gap-3 flex items-center" to="#">
                        <FaTwitter className=" text-white duration-300 group-hover:text-primary"/>                  
                        Twitter
                    </Link></li>
                    <li className="duration-100 hover:text-primary inline-block group"><Link className="gap-3 flex items-center" to="#">
                        <FaInstagram className=" text-white duration-300 group-hover:text-primary"/>                         
                        Instagram
                    </Link></li>
                    <li className="duration-100 hover:text-primary inline-block group"><Link className="gap-3 flex items-center" to="#">
                        <FiLinkedin className=" text-white duration-300 group-hover:text-primary"/>                    
                        Linkedin
                    </Link></li>
                </ul>
            </div>
        
            <div>
                <h4 className="leading-none mb-5 md:mb-6 text-xl text-white">Shop</h4>
                <ul className="text-white leading-none flex flex-col gap-4">
                    {footerLink3.map((item:LinkData,index:number)=>{
                        return(
                            <li className="duration-100 hover:text-primary inline-block group" key={index}><Link className="text-underline-primary" to={item.link}>{item.name}</Link></li>
                        )
                    })}
                </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
                <h4 className="leading-none mb-5 md:mb-6 text-xl text-white">Customer Service</h4>
                <ul className="text-white leading-none flex flex-col gap-4">
                    {footerLink4.map((item:LinkData,index:number)=>{
                        return(
                            <li className="duration-100 hover:text-primary inline-block group" key={index}><Link className="text-underline-primary" to={item.link}>{item.name}</Link></li>
                        )
                    })}
                </ul>
            </div>
        </div>
    </div>
  )
}
