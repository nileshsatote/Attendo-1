
let menuicn = document.querySelector(".menuicn");
let nav = document.querySelector(".navcontainer");

menuicn.addEventListener("click",()=>
{
	nav.classList.toggle("navclose");
})
{/* <div class="items">
<div class="item1">
	<h3 class="t-op-nextlvl">Article 73</h3>
	<h3 class="t-op-nextlvl">2.9k</h3>
	<h3 class="t-op-nextlvl">210</h3>
	<h3 class="t-op-nextlvl label-tag">Published</h3>
</div> */}

// const box = document.getElementById('boxx');
// const items = document.createElement('div');
// items.className = 'items';
// let item1 = document.createElement('div');
// item1.className = 'item1';

// for(let i=0;i<4;i++){
// 	let opions = document.createElement('h3');
// 	opions.className = 't-op-nextlvl';
// 	opions.innerHTML = "Hello";
// 	item1.appendChild(opions);
// }
// items.appendChild(item1);

// box.appendChild(items);