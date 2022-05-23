inlets = 1;
outlets = 1;
var cur = 0;
var last = 0;
var frwd = false;
function msg_int(x){
	last = cur;
	cur = x;
	post("currently: \n");
	post(cur);
	post(last);
	if (cur == 63 && last == 60){
		frwd = false;
	}else if(cur == 60 && last == 63){
		frwd = true;
	}else if (cur < last){
		frwd = false;
	}else if (cur > last){
		frwd = true;
	}
	out(cur);
}
function out(x){
	x = x - 59;
	if (frwd == true){
		outlet(0, x);
	}else{
		outlet(0, x + 4);
	}
}
