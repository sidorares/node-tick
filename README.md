v8.log processor based on scripts in v8 distribution. 
Allows you to profile V8-based programs without installing V8 from source.

### Install
	$ npm install -g tick

### Usage

See [V8 profiler page](http://code.google.com/p/v8/wiki/V8Profiler) for basic introduction to v8.log

	$ node --prof yourprogram
	$ node-tick-processor

### See also

`takeSnapshot` & `startProfiling` & `stopProfiling` V8 profiler API exposed to node.js: [v8-profiler](https://github.com/dannycoates/v8-profiler)


### V8 Performance optimisation resources

 - [v8-perf](https://thlorenz.github.io/v8-perf/)
 - [Trevor Norris notes](https://gist.github.com/trevnorris/6fea5ab2632dff8b5b25#file-perf-training-syllabus-md)
 - [V8 optimisations killers](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers)
 - [I-want-to-optimize-my-JS-application-on-V8 checklist](http://mrale.ph/blog/2011/12/18/v8-optimization-checklist.html) ( + [another listlist](http://mrale.ph/v8/resources.html) ) by <a href="https://github.com/mraleph" class="user-mention">@mraleph</a>

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/node-tick/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

