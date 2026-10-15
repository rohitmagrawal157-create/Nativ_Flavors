'use client'

// import { Link } from '@/lib/router';

// import bg from '../../assets/img/thank-you.png'

// import NavbarOne from "../../components/navbar/navbar-one";
// import FooterOne from "../../components/footer/footer-one";
// import ScrollToTop from "../../components/scroll-to-top";

// export default function ThankYou() {
//   return (
//     <>
//         <NavbarOne/>

//        <div
//           className="s-py-100 bg-overlay dark:before:bg-title dark:before:bg-opacity-80"
//           style={{
//             backgroundImage: `url('https://imgs.search.brave.com/9Dl10qoCUIwVLoDqAJtW_2thzI_lVv0UQ1L3B3BCR9E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2lmZnl3YWxscy5p/bi9jZG4vc2hvcC9m/aWxlcy90cm9waWNh/bC10cmVlcy13aGl0/ZS10b25lLW11cmFs/LXdhbGxwYXBlci01/NjQ2NjY1LmpwZz9x/dWFsaXR5PTkwJnY9/MTc3MzQwMDkzNSZ3/aWR0aD0xMzI2')`
//           }}
//           data-aos="fade-up"
//         >
//           {/* <img className="absolute top-0 right-0 w-[20%] z-[-1]" src={shape1} alt="shape" /> */}
//           <div className="container-fluid">
//             <div className="max-w-[1720px] mx-auto">
//               <div className="max-w-[1186px] ml-auto">

//                 <div className="max-w-xl mb-8 md:mb-12">
//                   <div>
//                     <img
//                       src={thumb}
//                       className="w-14 sm:w-24"
//                       alt=""
//                       style={{ filter: 'drop-shadow(0 4px 12px rgba(91,79,190,0.3))' }}
//                     />
//                   </div>
//                   {/* Gradient rule */}
//                   <div style={{ width: 48, height: 3, background: BRAND_GRAD_H, margin: '20px 0 16px', borderRadius: 2 }} />
//                   <h3
//                     className="leading-none text-2xl md:text-3xl"
//                     style={{ ...gradTxt, display: 'inline-block' }}
//                   >
//                     Why you Choose Us
//                   </h3>
//                   <p className="mt-3" style={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', backgroundColor: 'rgba(255,255,255,0.8)', padding: '12px 16px', borderRadius: 8 }}>
//                     Choose us for unparalleled quality, exceptional service, and a commitment to your satisfaction.
//                     Join countless others who rely on us for reliability.
//                   </p>
//                 </div>

//                 {/* Feature cards – professional theme */}
//                 <div
//                   className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
//                   data-aos="fade-up"
//                   data-aos-delay="100"
//                 >
//                   {featureOne.slice(0, 4).map((item: Feature, index: number) => (
//                     <div
//                       key={index}
//                       className="group relative bg-white rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-200/50 overflow-hidden"
//                       style={{
//                         border: '1px solid rgba(0,0,0,0.05)',
//                         background: 'white',
//                         transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1), box-shadow 0.4s ease',
//                       }}
//                     >
//                       {/* Animated gradient border on hover */}
//                       <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[#2F4A3A] via-[#E8314A] to-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

//                       {/* Moving dots background */}
//                       <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
//                         <div className="absolute inset-0 bg-[radial-gradient(#2F4A3A_1px,transparent_1px)] [background-size:16px_16px] animate-slow-drift" />
//                       </div>

//                       {/* Icon with bounce + rotation + scale */}
//                       <div className="relative z-10">
//                         <div
//                           className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:animate-iconPop group-hover:shadow-lg group-hover:text-gray-200"
//                           style={{
//                             background: 'linear-gradient(135deg, #e7e6ef 0%, #f5f5f5 50%, #58dfcf 100%)',
//                           }}
//                         >
//                           <img
//                             src={item.image}
//                             alt={item.title}
//                             className="w-7 h-7 brightness-0 invert transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 hover:text-gray-200"
//                           />
//                         </div>
//                       </div>

//                       {/* Title with sliding underline */}
//                       <h4 className="text-lg font-bold text-gray-900 mb-2 relative inline-block hover:text-gray-200">
//                         {item.title}
//                         <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2F4A3A] to-[#F97316] transition-all duration-500 group-hover:w-full " />
//                       </h4>

//                       {/* Description with fade-up */}
//                       <p className="text-sm text-gray-500 leading-relaxed transition-all duration-500 group-hover:translate-y-[-2px] group-hover:text-gray-200">
//                         {item.desc}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 <style>{`
//   @keyframes iconPop {
//     0% { transform: scale(1) translateY(0) rotate(0deg); }
//     40% { transform: scale(1.2) translateY(-6px) rotate(5deg); }
//     70% { transform: scale(0.95) translateY(2px) rotate(-2deg); }
//     100% { transform: scale(1) translateY(0) rotate(0deg); }
//   }
//   .animate-iconPop {
//     animation: iconPop 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
//   }
//   @keyframes slow-drift {
//     0% { background-position: 0 0; }
//     100% { background-position: 40px 40px; }
//   }
//   .animate-slow-drift {
//     animation: slow-drift 12s linear infinite;
//   }
// `}</style>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <FooterOne/>

//         <ScrollToTop/>
//     </>
//   )
// }
  
  
  
  
  