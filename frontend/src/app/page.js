import Image from "next/image";
import Footer from "./Footer/Footer";
import Hero from "./Hero/hero";
export default function Home() {
  return (
    <div className="home-wrapper">
      <div className="hero-container">
        <Hero />
      </div>
      <div className="footer">
        <Footer />
      </div>
    </div>
  );
}
