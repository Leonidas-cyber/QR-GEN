let currentQR = null;
const $ = (id) => document.getElementById(id);

function escapeWifi(str){
  return String(str).replace(/([\\;,:"])/g, '\\$1');
}

function updateInputType() {
  const type = $('qrType').value;
  const textArea = $('qrText');
  const wifiFields = $('wifiFields');

  wifiFields.style.display = 'none';
  switch (type) {
    case 'url': textArea.placeholder = 'https://ejemplo.com'; break;
    case 'email': textArea.placeholder = 'usuario@ejemplo.com'; break;
    case 'phone': textArea.placeholder = '+521234567890'; break;
    case 'sms': textArea.placeholder = '+521234567890:Mensaje'; break;
    case 'wifi': textArea.placeholder = 'Los datos se generarán automáticamente'; wifiFields.style.display = 'block'; break;
    default: textArea.placeholder = 'Introduce el texto o datos para el código QR';
  }
}

function updateSizeValue(v){ $('sizeValue').textContent = v + 'px'; }
function updateMarginValue(v){ $('marginValue').textContent = v + 'px'; }

function normalizeContentByType(type, raw){
  const text = raw.trim();
  if (type === 'url') return /^(https?:)?\/\//i.test(text) ? text : 'https://' + text;
  if (type === 'email') return text.startsWith('mailto:') ? text : 'mailto:' + text;
  if (type === 'phone') return text.startsWith('tel:') ? text : 'tel:' + text.replace(/\s+/g,'');
  if (type === 'sms') {
    const [num, ...msg] = text.split(':');
    return 'SMSTO:' + num.trim() + (msg.length ? ':' + msg.join(':').trim() : '');
  }
  return text;
}

function getQRContent() {
  const type = $('qrType').value;
  if (type === 'wifi') {
    const ssid = $('wifiSSID').value.trim();
    const password = $('wifiPassword').value;
    const security = $('wifiSecurity').value;
    const hidden = $('wifiHidden').checked;
    if (!ssid) throw new Error('El SSID es obligatorio');
    let parts = ['WIFI:'];
    parts.push('T:' + security + ';');
    parts.push('S:' + escapeWifi(ssid) + ';');
    if (security !== 'nopass') {
      if (!password) throw new Error('La contraseña es obligatoria');
      parts.push('P:' + escapeWifi(password) + ';');
    }
    if (hidden) parts.push('H:true;');
    parts.push(';');
    return parts.join('');
  }
  const raw = $('qrText').value;
  if (!raw.trim()) throw new Error('El contenido no puede estar vacío');
  return normalizeContentByType(type, raw);
}

function showMessage(msg, type) {
  const div = $('messages');
  const cls = type === 'success' ? 'success-message' : 'error-message';
  div.innerHTML = `<div class="${cls}">${msg}</div>`;
  setTimeout(()=>div.innerHTML='',5000);
}

function renderQR(canvas, options){
  return new QRious({
    element: canvas,
    value: options.value,
    size: options.size,
    background: options.background,
    foreground: options.foreground,
    level: options.level
  });
}

function generateQR() {
  try {
    const content = getQRContent();
    const size = parseInt($('qrSize').value,10);
    const margin = parseInt($('marginSize').value,10);
    const fg = $('foregroundColor').value;
    const bg = $('backgroundColor').value;
    const level = $('errorCorrectionLevel').value;
    const canvas = $('qrCanvas');
    renderQR(canvas, {value:content,size,foreground:fg,background:bg,level});
    $('qrContainer').style.padding = margin+'px';
    $('qrContainer').style.border = margin>0 ? '2px dashed #ccc':'none';
    $('qrPreview').style.display='block';
    currentQR={canvas,content,size,margin,foregroundColor:fg,backgroundColor:bg,level};
    showMessage('¡Código QR generado!', 'success');
  } catch(e){ showMessage(e.message,'error'); }
}

function downloadQR(format){
  if(!currentQR) return;
  const c=currentQR.canvas,m=currentQR.margin;
  const final=document.createElement('canvas');
  const ctx=final.getContext('2d');
  final.width=c.width+m*2; final.height=c.height+m*2;
  ctx.fillStyle=currentQR.backgroundColor||'#fff';
  ctx.fillRect(0,0,final.width,final.height);
  ctx.drawImage(c,m,m);
  const link=document.createElement('a');
  link.download='codigo-qr.'+format;
  link.href=format==='jpg'?final.toDataURL('image/jpeg',0.92):final.toDataURL('image/png');
  link.click();
}

function printQR(){
  if(!currentQR) return;
  const c=currentQR.canvas,m=currentQR.margin;
  const dataURL=c.toDataURL('image/png');
  const w=window.open('','','width=800,height=800');
  w.document.open();
  w.document.write(`
    <html><head><title>Imprimir QR</title>
    <style>
      body{margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;}
      .qr-print{text-align:center;padding:${m}px;border:2px solid #000;}
      img{max-width:100%;height:auto;}
    </style></head>
    <body><div class="qr-print"><img src="${dataURL}" alt="QR"/></div></body></html>
  `);
  w.document.close();
  w.onload=()=>{w.print();w.close();}
}

// Eventos
$('qrType').addEventListener('change',()=>{updateInputType(); if(currentQR) generateQR();});
$('qrSize').addEventListener('input',function(){updateSizeValue(this.value); if(currentQR) generateQR();});
$('marginSize').addEventListener('input',function(){updateMarginValue(this.value); if(currentQR){$('qrContainer').style.padding=this.value+'px';}});
$('foregroundColor').addEventListener('change',()=>{if(currentQR) generateQR();});
$('backgroundColor').addEventListener('change',()=>{if(currentQR) generateQR();});
$('errorCorrectionLevel').addEventListener('change',()=>{if(currentQR) generateQR();});
$('btnGenerate').addEventListener('click',generateQR);

// Inicializar
updateInputType();
updateSizeValue($('qrSize').value);
updateMarginValue($('marginSize').value);