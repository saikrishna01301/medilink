import Image from 'next/image';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className = "fixed top-40 z-20  ">
        <p className = " font-adoha  text-6xl text-black text-center">
        Your Complete Health History
        <br />
        Secure, Simple & All in One Place! 
        </p>
        <p className = "py-20 z-20 font-urbane  text-1xl text-black text-center">
        Stop Chasing paper records and fumbling with files.<br />MediHealth Brings your medical history, prescription, and tests results<br />together connecting you seamlessly with your doctor's and insurer.
        </p>
        {/* <div className='width-1230 aling-center color-black z-20'>

            <img className = ""
            src = "/Asset2.svg"
            width = {532} 
            style={{marginLeft: '-150px', transform: 'scaleX(-1)'} }
            
            />
            <p className = "z-20 py-20 z-20 font-adoha  text-3xl text-black text-center">Tired of Scattered Healthcare <br /> Journey?</p>
            <p className = "z-20 font-urbane  text-1xl text-black text-center">
        Your health data lives in different clinics, labs, and <br />pharmacies, making it impossible to see the full picture.
        </p>
        </div> */}

        <div className='flex-container width-1230 z-20'>
  
        {/* Item 1: The Image */}
        <img 
            className=""
            src="/Asset2.svg"
            width={532} 
            style={{ marginLeft: '-90px', transform: 'scaleX(-1)', }} // Removed the negative margin for now
        />

        {/* Item 2: The Text Container */}
        <div className="z-20 fixed top-150 text-content  max-w-[500px]" style={{ marginLeft: '500px' }}>
            <p className="font-adoha text-3xl text-black text-center">
            Tired of Scattered Healthcare <br /> Journey?
            </p>
            <p className="font-urbane text-1xl text-black text-center">
            Your health data lives in different clinics, labs, and <br />pharmacies, making it impossible to see the full picture.
            </p>
        </div>

        </div>

            </div>
    
    

  );
};

export default LandingPage;