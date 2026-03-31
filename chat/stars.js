(function(){
  const canvas=document.getElementById('stars');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let stars=[];
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  resize();
  window.addEventListener('resize',resize);
  for(let i=0;i<100;i++){
    stars.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      size:Math.random()>0.9?2:1,
      speed:Math.random()*0.3+0.05,
      blink:Math.random()*Math.PI*2,
      blinkSpeed:Math.random()*0.02+0.005
    });
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{
      s.blink+=s.blinkSpeed;
      const alpha=0.3+Math.sin(s.blink)*0.3;
      ctx.fillStyle=`rgba(200, 200, 240, ${alpha})`;
      ctx.fillRect(Math.floor(s.x),Math.floor(s.y),s.size,s.size);
      s.y-=s.speed;
      if(s.y<-2){s.y=canvas.height+2;s.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
