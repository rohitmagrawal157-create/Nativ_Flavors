'use client'

import  { useState } from 'react'

export default function SelectTwo() {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<string>("Sort by");

    const options = [
        "Sort by Latest",
        "Sort by Name",
        "Sort by Number",
        "Sort by Price",
        "Sort by Date",
        ];
        const handleSelect = (option:string) => {
        setSelectedOption(option);
        setIsOpen(false);
        };

  return (
    <div className={`nice-select bg-white dark:bg-dark outline-select small-select ${isOpen ? 'open' : ''}`}  onClick={() => setIsOpen(!isOpen)}><span className="current">{selectedOption}</span>
        <ul className="list">
            {options.map((item,index)=>{
                return(
                    <li data-value="1" className="option" onClick={() => handleSelect(item)} key={index}>{item}</li>
                )
            })}
        </ul>
    </div>
  )
}
