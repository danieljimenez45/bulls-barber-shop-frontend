import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaScissors } from "react-icons/fa6";
import SeoHead from "../components/SeoHead";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="page notfound-page">
      <SeoHead
        title="Página no encontrada"
        canonical=""
        description="La página que buscas no existe. Vuelve al inicio de Bulls Barber Shop."
      />
      <div className="container notfound-container">
        <motion.div
          className="notfound-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="notfound-icon">
            <FaScissors />
          </div>

          <div className="accent-line" />

          <h1 className="notfound-code">404</h1>

          <h2 className="notfound-title">Página no encontrada</h2>

          <p className="notfound-text">
            Parece que esta página se fue a cortarse el pelo y aún no ha vuelto.
            Vuelve al inicio y encontrarás todo lo que necesitas.
          </p>

          <Link to="/" className="btn btn-primary notfound-btn">
            <FaArrowLeft />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
