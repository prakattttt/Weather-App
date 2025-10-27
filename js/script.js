const searchPlace = document.querySelector('#place');
const lists = document.querySelector(".lists");

searchPlace.addEventListener('input', () => {
    if(searchPlace.value !== "") {
        searchPlace.style.backgroundImage = "none";
        lists.style.display = "block";
    }  else {
        searchPlace.style.backgroundImage = "url(../assets/images/icon-search.svg)";
        lists.style.display = "none";
    }
})




