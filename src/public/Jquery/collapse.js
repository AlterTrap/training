$(document).ready(function(){
    var getElements = document.querySelectorAll('.collapse');
    Array.from(getElements).forEach(function(element) {
    if ((element.offsetHeight < element.scrollHeight) || (element.offsetWidth < element.scrollWidth)) {
        // do nothing
    } else {
        element.nextSibling.style.display = 'none';
    }
    });
  });