
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AK INTELLIGENCE</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#08111f;color:white;font-family:Arial,sans-serif}
header{padding:22px;text-align:center;background:#101e32;border-bottom:2px solid #168cff}
h1{color:#28a0ff;margin:0}
main{max-width:750px;margin:25px auto;padding:18px}
select,textarea,button{width:100%;padding:14px;margin:9px 0;border-radius:9px;font-size:16px}
select,textarea{background:#14243a;color:white;border:1px solid #34506d}
textarea{min-height:120px;resize:vertical}
button{background:#168cff;color:white;border:0;font-weight:bold}
button:disabled{opacity:.5}
#answer{background:#14243a;padding:18px;border-radius:10px;min-height:90px;white-space:pre-wrap;line-height:1.6}
footer{text-align:center;color:#91a4ba;padding:25px}
</style>
</head>
<body>
<header>
<h1>AK INTELLIGENCE</h1>
<p>Votre intelligence artificielle personnelle</p>
</header>
<main>
<h2>Choisissez votre agent</h2>
<select id="agent">
<option>Assistant</option>
<option>Writer</option>
<option>Developer</option>
<option>Analyst</option>
<option>Business</option>
</select>
<h2>Votre question</h2>
<textarea id="question" placeholder="Écrivez votre question ici..."></textarea>
<button id="send" onclick="askAI()">Envoyer ma question</button>
<h2>Réponse de AK INTELLIGENCE</h2>
<div id="answer">Votre réponse apparaîtra ici.</div>
</main>
<footer>© 2026 AK INTELLIGENCE</footer>
<script>
const API_URL = "https://ak-intelligence-api.abdoulayeky080.workers.dev";

async function askAI(){
 const question=document.getElementById("question").value.trim();
 const agent=document.getElementById("agent").value;
 const answer=document.getElementById("answer");
 const button=document.getElementById("send");

 if(!question){
  answer.textContent="Écrivez d'abord une question.";
  return;
 }

 button.disabled=true;
 answer.textContent="AK INTELLIGENCE réfléchit...";

 try{
  const response=await fetch(API_URL,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({agent,question})
  });

  const data=await response.json();

  if(!response.ok || !data.success){
   throw new Error(data.error || "Erreur du serveur.");
  }

  answer.textContent=data.answer;
 }catch(error){
  answer.textContent="Impossible de contacter AK INTELLIGENCE. Vérifiez votre connexion et réessayez.";
 }finally{
  button.disabled=false;
 }
}
</script>
</body>
</html><meta name="google-site-verification" content="...">
