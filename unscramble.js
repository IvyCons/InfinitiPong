inlets = 1;
outlets = 1;
function msg_int(x){
	var cur = x;
	if (cur == 61){
		cur = 62;
	}else if (cur == 62){
		cur = 61;
	}
	outlet(0, cur);
}