/* ==========================================
   ESTILOS GENERALES Y RESET
   ========================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    text-align: center;
    background: #000;
}

/* ==========================================
   FONDOS Y CAPA DE OSCURIDAD (OVERLAY)
   ========================================== */
.background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 2.5s ease-in-out;
    z-index: -2;
}

.background.active {
    opacity: 1;
}

.overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        rgba(0, 0, 0, 0.50),
        rgba(0, 0, 0, 0.80)
    );
    backdrop-filter: blur(4px);
    z-index: -1;
}

/* ==========================================
   CONTENEDOR PRINCIPAL
   ========================================== */
.content {
    position: relative;
    z-index: 10;
    width: 92%;
    max-width: 1500px;
    height: 90vh;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    padding: 15px 0;
}

/* Títulos superiores sobredimensionados para que se vean bien en la TV */
h1#welcome {
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #38bdf8;
    text-shadow: 0 3px 8px rgba(0, 0, 0, 0.95);
}

#guest {
    font-size: 4.1rem;
    font-weight: 600;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.95);
    margin: 5px 0;
}

#message {
    font-size: 2.1rem;
    color: #f1f5f9;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95);
}

#clock {
    font-size: 1.3rem;
    opacity: 0.95;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.95);
}

/* ==========================================
   TARJETAS EN DOS COLUMNAS
   ========================================== */
.cards-wrapper {
    display: flex;
    gap: 30px;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 1200px;
}

.info-card {
    flex: 1;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 24px;
    padding: 24px 30px;
    text-align: left;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
    
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.card-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-text h3 {
    font-size: 1.3rem;
    color: #38bdf8;
    margin-bottom: 10px;
}

.card-text p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: #f8fafc;
    word-break: break-word;
}

/* Contenedor del QR */
.qr-box {
    background: white;
    padding: 10px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.qr-box img {
    width: 120px;
    height: 120px;
    display: block;
    border-radius: 6px;
}

.qr-box span {
    font-size: 0.75rem;
    color: #0f172a;
    font-weight: 600;
    margin-top: 6px;
    display: block;
}

.footer {
    font-size: 1.1rem;
    opacity: 0.9;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
}

/* ==========================================
   WIDGET DEL CLIMA (SUPERIOR DERECHA)
   ========================================== */
.weather-card {
    position: absolute;
    top: 35px;
    right: 40px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 12px 24px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}

.weather-icon {
    font-size: 2rem;
}

.weather-temp {
    font-size: 1.7rem;
    font-weight: 700;
}

.weather-desc {
    font-size: 0.9rem;
    opacity: 0.85;
    text-align: left;
}

/* ==========================================
   BOTÓN DE SILENCIAR (INFERIOR IZQUIERDA)
   ========================================== */
#muteBtn {
    position: absolute;
    bottom: 35px;
    left: 40px;
    width: 65px;
    height: 65px;
    border: none;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: white;
    font-size: 28px;
    cursor: pointer;
    z-index: 100;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
    transition: background 0.3s;
}

#muteBtn:hover {
    background: rgba(15, 23, 42, 0.95);
}