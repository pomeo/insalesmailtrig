document.addEventListener('DOMContentLoaded', function(){
  if ($.cookie('INSALES_MAILTRIG_VISIT') == undefined) {
    $.cookie('INSALES_MAILTRIG_VISIT', 1, { expires: 1, path: '/' });
  }
  setInterval(doCheckCart, 2000);
});
