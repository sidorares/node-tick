function slow() {
  var res=0;
  for (var i=0; i < 10000000; ++i)
    res += i;
  return res;
}

console.log(slow() + slow() + slow());
