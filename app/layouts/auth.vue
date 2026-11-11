<template>
  <div class="auth">
    <div class="lado">
      <img src="/img/logo-branco.png" alt="NOVALE" class="logo" />
      <div class="tit">Step<b>Check</b></div>
      <p>Gestão de testes e aprovações com rastreabilidade completa de cada etapa.</p>
      <img src="/img/simbolo-branco.png" alt="" class="esfera" />
    </div>
    <div class="form-area"><slot /></div>
  </div>
</template>
<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
.lado { background: radial-gradient(circle at 20% 10%, #1a3f86 0%, var(--navy) 55%, #081d44 100%); color: #fff; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
.logo { width: 230px; }
.tit { font-family: var(--font-title); font-size: 30px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; margin-top: 26px; color: #B9C6E6; }
.tit b { color: #fff; font-weight: 800; }
.lado p { max-width: 380px; color: #C9D3EA; font-size: 15px; margin-top: 10px; }
.esfera { position: absolute; right: -90px; bottom: -90px; width: 380px; opacity: .12; }
.form-area { display: flex; align-items: center; justify-content: center; padding: 32px 20px; background: var(--bg); }
@media (max-width: 860px) {
  .auth { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .lado { padding: 28px 24px; } .logo { width: 160px; } .tit { font-size: 20px; margin-top: 14px; } .lado p { display: none; } .esfera { width: 200px; right: -50px; bottom: -60px; }
  .form-area { align-items: flex-start; }
}
</style>
