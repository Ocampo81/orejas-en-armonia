/* =====================================
   REVEAL AL HACER SCROLL
===================================== */
.section-block{
  position:relative;
}
.reveal{
  opacity:0;
  will-change:opacity, transform;
  transition:opacity .7s ease, transform .7s ease;
}
.reveal--up{ transform:translateY(32px); }
.reveal--left{ transform:translateX(-32px); }
.reveal--right{ transform:translateX(32px); }
.reveal.is-visible{
  opacity:1;
  transform:none;
}

/* =====================================
   RESPONSIVE GENERAL
===================================== */

/* Tablet / layout general */
@media (max-width: 980px){
  .hero__inner{
    grid-template-columns:1fr;
    text-align:center;
  }
  .hero__copy p{ margin-left:auto; margin-right:auto; }
  .hero__visual{ order:-1; }
  .hero__logo{ height:260px; }

  .cards{ grid-template-columns:1fr 1fr; }
  .how__grid{ grid-template-columns:1fr; }
}

/* Navbar móvil + columnas */
@media (max-width: 900px){
  .nav__toggle{ display:block; }

  .nav__menu{
    position:fixed;
    top:64px;
    right:16px;
    left:16px;
    background:#fff;
    border:1px solid #eee;
    border-radius:14px;
    box-shadow:0 10px 30px rgba(0,0,0,.10);
    padding:12px;
    display:none;
    flex-direction:column;
    gap:6px;
    white-space:normal;
  }
  .nav__menu.is-open{ display:flex; }
  .nav__menu a{
    width:100%;
    text-align:center;
    padding:12px;
    border-radius:10px;
  }

  .lang-switch{ display:none; }

  .hero{ padding:96px 0 72px; }

  .grid-3{ grid-template-columns:1fr; }
}

/* Responsive iconos flotantes */
@media (max-width: 768px) {
  .float-left-icons,
  .float-right-icons {
    bottom: 90px;
  }
  .icon-btn {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }
}

/* Carrusel antes/después – flechas más centradas en móvil */
@media (max-width:640px){
  .ba-prev{ left:8px; }
  .ba-next{ right:8px; }
}
