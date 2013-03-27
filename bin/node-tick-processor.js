#!/usr/bin/env node

print = console.log;
var arguments = process.argv;

var v8log = require('fs').readFileSync('./v8.log').toString('binary');
var lines = v8log.split('\n');
var l = 0;
var readline = function()
{
    if (l == lines.length)
        return;
    l++;
    return lines[l];
}

//=======================================================================================================================================
// code below is result of
// cat splaytree.js codemap.js csvparser.js consarray.js profile.js profile_view.js logreader.js tickprocessor.js tickprocessor-driver.js
// (c) V8 team 
// ======================================================================================================================================

// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Constructs a Splay tree.  A splay tree is a self-balancing binary
 * search tree with the additional property that recently accessed
 * elements are quick to access again. It performs basic operations
 * such as insertion, look-up and removal in O(log(n)) amortized time.
 *
 * @constructor
 */
function SplayTree() {
};


/**
 * Pointer to the root node of the tree.
 *
 * @type {SplayTree.Node}
 * @private
 */
SplayTree.prototype.root_ = null;


/**
 * @return {boolean} Whether the tree is empty.
 */
SplayTree.prototype.isEmpty = function() {
  return !this.root_;
};



/**
 * Inserts a node into the tree with the specified key and value if
 * the tree does not already contain a node with the specified key. If
 * the value is inserted, it becomes the root of the tree.
 *
 * @param {number} key Key to insert into the tree.
 * @param {*} value Value to insert into the tree.
 */
SplayTree.prototype.insert = function(key, value) {
  if (this.isEmpty()) {
    this.root_ = new SplayTree.Node(key, value);
    return;
  }
  // Splay on the key to move the last node on the search path for
  // the key to the root of the tree.
  this.splay_(key);
  if (this.root_.key == key) {
    return;
  }
  var node = new SplayTree.Node(key, value);
  if (key > this.root_.key) {
    node.left = this.root_;
    node.right = this.root_.right;
    this.root_.right = null;
  } else {
    node.right = this.root_;
    node.left = this.root_.left;
    this.root_.left = null;
  }
  this.root_ = node;
};


/**
 * Removes a node with the specified key from the tree if the tree
 * contains a node with this key. The removed node is returned. If the
 * key is not found, an exception is thrown.
 *
 * @param {number} key Key to find and remove from the tree.
 * @return {SplayTree.Node} The removed node.
 */
SplayTree.prototype.remove = function(key) {
  if (this.isEmpty()) {
    throw Error('Key not found: ' + key);
  }
  this.splay_(key);
  if (this.root_.key != key) {
    throw Error('Key not found: ' + key);
  }
  var removed = this.root_;
  if (!this.root_.left) {
    this.root_ = this.root_.right;
  } else {
    var right = this.root_.right;
    this.root_ = this.root_.left;
    // Splay to make sure that the new root has an empty right child.
    this.splay_(key);
    // Insert the original right child as the right child of the new
    // root.
    this.root_.right = right;
  }
  return removed;
};


/**
 * Returns the node having the specified key or null if the tree doesn't contain
 * a node with the specified key.
 *
 * @param {number} key Key to find in the tree.
 * @return {SplayTree.Node} Node having the specified key.
 */
SplayTree.prototype.find = function(key) {
  if (this.isEmpty()) {
    return null;
  }
  this.splay_(key);
  return this.root_.key == key ? this.root_ : null;
};


/**
 * @return {SplayTree.Node} Node having the minimum key value.
 */
SplayTree.prototype.findMin = function() {
  if (this.isEmpty()) {
    return null;
  }
  var current = this.root_;
  while (current.left) {
    current = current.left;
  }
  return current;
};


/**
 * @return {SplayTree.Node} Node having the maximum key value.
 */
SplayTree.prototype.findMax = function(opt_startNode) {
  if (this.isEmpty()) {
    return null;
  }
  var current = opt_startNode || this.root_;
  while (current.right) {
    current = current.right;
  }
  return current;
};


/**
 * @return {SplayTree.Node} Node having the maximum key value that
 *     is less or equal to the specified key value.
 */
SplayTree.prototype.findGreatestLessThan = function(key) {
  if (this.isEmpty()) {
    return null;
  }
  // Splay on the key to move the node with the given key or the last
  // node on the search path to the top of the tree.
  this.splay_(key);
  // Now the result is either the root node or the greatest node in
  // the left subtree.
  if (this.root_.key <= key) {
    return this.root_;
  } else if (this.root_.left) {
    return this.findMax(this.root_.left);
  } else {
    return null;
  }
};


/**
 * @return {Array<*>} An array containing all the values of tree's nodes paired
 *     with keys.
 */
SplayTree.prototype.exportKeysAndValues = function() {
  var result = [];
  this.traverse_(function(node) { result.push([node.key, node.value]); });
  return result;
};


/**
 * @return {Array<*>} An array containing all the values of tree's nodes.
 */
SplayTree.prototype.exportValues = function() {
  var result = [];
  this.traverse_(function(node) { result.push(node.value); });
  return result;
};


/**
 * Perform the splay operation for the given key. Moves the node with
 * the given key to the top of the tree.  If no node has the given
 * key, the last node on the search path is moved to the top of the
 * tree. This is the simplified top-down splaying algorithm from:
 * "Self-adjusting Binary Search Trees" by Sleator and Tarjan
 *
 * @param {number} key Key to splay the tree on.
 * @private
 */
SplayTree.prototype.splay_ = function(key) {
  if (this.isEmpty()) {
    return;
  }
  // Create a dummy node.  The use of the dummy node is a bit
  // counter-intuitive: The right child of the dummy node will hold
  // the L tree of the algorithm.  The left child of the dummy node
  // will hold the R tree of the algorithm.  Using a dummy node, left
  // and right will always be nodes and we avoid special cases.
  var dummy, left, right;
  dummy = left = right = new SplayTree.Node(null, null);
  var current = this.root_;
  while (true) {
    if (key < current.key) {
      if (!current.left) {
        break;
      }
      if (key < current.left.key) {
        // Rotate right.
        var tmp = current.left;
        current.left = tmp.right;
        tmp.right = current;
        current = tmp;
        if (!current.left) {
          break;
        }
      }
      // Link right.
      right.left = current;
      right = current;
      current = current.left;
    } else if (key > current.key) {
      if (!current.right) {
        break;
      }
      if (key > current.right.key) {
        // Rotate left.
        var tmp = current.right;
        current.right = tmp.left;
        tmp.left = current;
        current = tmp;
        if (!current.right) {
          break;
        }
      }
      // Link left.
      left.right = current;
      left = current;
      current = current.right;
    } else {
      break;
    }
  }
  // Assemble.
  left.right = current.left;
  right.left = current.right;
  current.left = dummy.right;
  current.right = dummy.left;
  this.root_ = current;
};


/**
 * Performs a preorder traversal of the tree.
 *
 * @param {function(SplayTree.Node)} f Visitor function.
 * @private
 */
SplayTree.prototype.traverse_ = function(f) {
  var nodesToVisit = [this.root_];
  while (nodesToVisit.length > 0) {
    var node = nodesToVisit.shift();
    if (node == null) {
      continue;
    }
    f(node);
    nodesToVisit.push(node.left);
    nodesToVisit.push(node.right);
  }
};


/**
 * Constructs a Splay tree node.
 *
 * @param {number} key Key.
 * @param {*} value Value.
 */
SplayTree.Node = function(key, value) {
  this.key = key;
  this.value = value;
};


/**
 * @type {SplayTree.Node}
 */
SplayTree.Node.prototype.left = null;


/**
 * @type {SplayTree.Node}
 */
SplayTree.Node.prototype.right = null;
// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Constructs a mapper that maps addresses into code entries.
 *
 * @constructor
 */
function CodeMap() {
  /**
   * Dynamic code entries. Used for JIT compiled code.
   */
  this.dynamics_ = new SplayTree();

  /**
   * Name generator for entries having duplicate names.
   */
  this.dynamicsNameGen_ = new CodeMap.NameGenerator();

  /**
   * Static code entries. Used for statically compiled code.
   */
  this.statics_ = new SplayTree();

  /**
   * Libraries entries. Used for the whole static code libraries.
   */
  this.libraries_ = new SplayTree();

  /**
   * Map of memory pages occupied with static code.
   */
  this.pages_ = [];
};


/**
 * The number of alignment bits in a page address.
 */
CodeMap.PAGE_ALIGNMENT = 12;


/**
 * Page size in bytes.
 */
CodeMap.PAGE_SIZE =
    1 << CodeMap.PAGE_ALIGNMENT;


/**
 * Adds a dynamic (i.e. moveable and discardable) code entry.
 *
 * @param {number} start The starting address.
 * @param {CodeMap.CodeEntry} codeEntry Code entry object.
 */
CodeMap.prototype.addCode = function(start, codeEntry) {
  this.deleteAllCoveredNodes_(this.dynamics_, start, start + codeEntry.size);
  this.dynamics_.insert(start, codeEntry);
};


/**
 * Moves a dynamic code entry. Throws an exception if there is no dynamic
 * code entry with the specified starting address.
 *
 * @param {number} from The starting address of the entry being moved.
 * @param {number} to The destination address.
 */
CodeMap.prototype.moveCode = function(from, to) {
  var removedNode = this.dynamics_.remove(from);
  this.deleteAllCoveredNodes_(this.dynamics_, to, to + removedNode.value.size);
  this.dynamics_.insert(to, removedNode.value);
};


/**
 * Discards a dynamic code entry. Throws an exception if there is no dynamic
 * code entry with the specified starting address.
 *
 * @param {number} start The starting address of the entry being deleted.
 */
CodeMap.prototype.deleteCode = function(start) {
  var removedNode = this.dynamics_.remove(start);
};


/**
 * Adds a library entry.
 *
 * @param {number} start The starting address.
 * @param {CodeMap.CodeEntry} codeEntry Code entry object.
 */
CodeMap.prototype.addLibrary = function(
    start, codeEntry) {
  this.markPages_(start, start + codeEntry.size);
  this.libraries_.insert(start, codeEntry);
};


/**
 * Adds a static code entry.
 *
 * @param {number} start The starting address.
 * @param {CodeMap.CodeEntry} codeEntry Code entry object.
 */
CodeMap.prototype.addStaticCode = function(
    start, codeEntry) {
  this.statics_.insert(start, codeEntry);
};


/**
 * @private
 */
CodeMap.prototype.markPages_ = function(start, end) {
  for (var addr = start; addr <= end;
       addr += CodeMap.PAGE_SIZE) {
    this.pages_[addr >>> CodeMap.PAGE_ALIGNMENT] = 1;
  }
};


/**
 * @private
 */
CodeMap.prototype.deleteAllCoveredNodes_ = function(tree, start, end) {
  var to_delete = [];
  var addr = end - 1;
  while (addr >= start) {
    var node = tree.findGreatestLessThan(addr);
    if (!node) break;
    var start2 = node.key, end2 = start2 + node.value.size;
    if (start2 < end && start < end2) to_delete.push(start2);
    addr = start2 - 1;
  }
  for (var i = 0, l = to_delete.length; i < l; ++i) tree.remove(to_delete[i]);
};


/**
 * @private
 */
CodeMap.prototype.isAddressBelongsTo_ = function(addr, node) {
  return addr >= node.key && addr < (node.key + node.value.size);
};


/**
 * @private
 */
CodeMap.prototype.findInTree_ = function(tree, addr) {
  var node = tree.findGreatestLessThan(addr);
  return node && this.isAddressBelongsTo_(addr, node) ? node.value : null;
};


/**
 * Finds a code entry that contains the specified address. Both static and
 * dynamic code entries are considered.
 *
 * @param {number} addr Address.
 */
CodeMap.prototype.findEntry = function(addr) {
  var pageAddr = addr >>> CodeMap.PAGE_ALIGNMENT;
  if (pageAddr in this.pages_) {
    // Static code entries can contain "holes" of unnamed code.
    // In this case, the whole library is assigned to this address.
    return this.findInTree_(this.statics_, addr) ||
        this.findInTree_(this.libraries_, addr);
  }
  var min = this.dynamics_.findMin();
  var max = this.dynamics_.findMax();
  if (max != null && addr < (max.key + max.value.size) && addr >= min.key) {
    var dynaEntry = this.findInTree_(this.dynamics_, addr);
    if (dynaEntry == null) return null;
    // Dedupe entry name.
    if (!dynaEntry.nameUpdated_) {
      dynaEntry.name = this.dynamicsNameGen_.getName(dynaEntry.name);
      dynaEntry.nameUpdated_ = true;
    }
    return dynaEntry;
  }
  return null;
};


/**
 * Returns a dynamic code entry using its starting address.
 *
 * @param {number} addr Address.
 */
CodeMap.prototype.findDynamicEntryByStartAddress =
    function(addr) {
  var node = this.dynamics_.find(addr);
  return node ? node.value : null;
};


/**
 * Returns an array of all dynamic code entries.
 */
CodeMap.prototype.getAllDynamicEntries = function() {
  return this.dynamics_.exportValues();
};


/**
 * Returns an array of pairs of all dynamic code entries and their addresses.
 */
CodeMap.prototype.getAllDynamicEntriesWithAddresses = function() {
  return this.dynamics_.exportKeysAndValues();
};


/**
 * Returns an array of all static code entries.
 */
CodeMap.prototype.getAllStaticEntries = function() {
  return this.statics_.exportValues();
};


/**
 * Returns an array of all libraries entries.
 */
CodeMap.prototype.getAllLibrariesEntries = function() {
  return this.libraries_.exportValues();
};


/**
 * Creates a code entry object.
 *
 * @param {number} size Code entry size in bytes.
 * @param {string} opt_name Code entry name.
 * @constructor
 */
CodeMap.CodeEntry = function(size, opt_name) {
  this.size = size;
  this.name = opt_name || '';
  this.nameUpdated_ = false;
};


CodeMap.CodeEntry.prototype.getName = function() {
  return this.name;
};


CodeMap.CodeEntry.prototype.toString = function() {
  return this.name + ': ' + this.size.toString(16);
};


CodeMap.NameGenerator = function() {
  this.knownNames_ = {};
};


CodeMap.NameGenerator.prototype.getName = function(name) {
  if (!(name in this.knownNames_)) {
    this.knownNames_[name] = 0;
    return name;
  }
  var count = ++this.knownNames_[name];
  return name + ' {' + count + '}';
};
// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Creates a CSV lines parser.
 */
function CsvParser() {
};


/**
 * A regex for matching a CSV field.
 * @private
 */
CsvParser.CSV_FIELD_RE_ = /^"((?:[^"]|"")*)"|([^,]*)/;


/**
 * A regex for matching a double quote.
 * @private
 */
CsvParser.DOUBLE_QUOTE_RE_ = /""/g;


/**
 * Parses a line of CSV-encoded values. Returns an array of fields.
 *
 * @param {string} line Input line.
 */
CsvParser.prototype.parseLine = function(line) {
  var fieldRe = CsvParser.CSV_FIELD_RE_;
  var doubleQuoteRe = CsvParser.DOUBLE_QUOTE_RE_;
  var pos = 0;
  var endPos = line.length;
  var fields = [];
  if (endPos > 0) {
    do {
      var fieldMatch = fieldRe.exec(line.substr(pos));
      if (typeof fieldMatch[1] === "string") {
        var field = fieldMatch[1];
        pos += field.length + 3;  // Skip comma and quotes.
        fields.push(field.replace(doubleQuoteRe, '"'));
      } else {
        // The second field pattern will match anything, thus
        // in the worst case the match will be an empty string.
        var field = fieldMatch[2];
        pos += field.length + 1;  // Skip comma.
        fields.push(field);
      }
    } while (pos <= endPos);
  }
  return fields;
};
// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Constructs a ConsArray object. It is used mainly for tree traversal.
 * In this use case we have lots of arrays that we need to iterate
 * sequentally. The internal Array implementation is horribly slow
 * when concatenating on large (10K items) arrays due to memory copying.
 * That's why we avoid copying memory and insead build a linked list
 * of arrays to iterate through.
 *
 * @constructor
 */
function ConsArray() {
  this.tail_ = new ConsArray.Cell(null, null);
  this.currCell_ = this.tail_;
  this.currCellPos_ = 0;
};


/**
 * Concatenates another array for iterating. Empty arrays are ignored.
 * This operation can be safely performed during ongoing ConsArray
 * iteration.
 *
 * @param {Array} arr Array to concatenate.
 */
ConsArray.prototype.concat = function(arr) {
  if (arr.length > 0) {
    this.tail_.data = arr;
    this.tail_ = this.tail_.next = new ConsArray.Cell(null, null);
  }
};


/**
 * Whether the end of iteration is reached.
 */
ConsArray.prototype.atEnd = function() {
  return this.currCell_ === null ||
      this.currCell_.data === null ||
      this.currCellPos_ >= this.currCell_.data.length;
};


/**
 * Returns the current item, moves to the next one.
 */
ConsArray.prototype.next = function() {
  var result = this.currCell_.data[this.currCellPos_++];
  if (this.currCellPos_ >= this.currCell_.data.length) {
    this.currCell_ = this.currCell_.next;
    this.currCellPos_ = 0;
  }
  return result;
};


/**
 * A cell object used for constructing a list in ConsArray.
 *
 * @constructor
 */
ConsArray.Cell = function(data, next) {
  this.data = data;
  this.next = next;
};

// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Creates a profile object for processing profiling-related events
 * and calculating function execution times.
 *
 * @constructor
 */
function Profile() {
  this.codeMap_ = new CodeMap();
  this.topDownTree_ = new CallTree();
  this.bottomUpTree_ = new CallTree();
};


/**
 * Returns whether a function with the specified name must be skipped.
 * Should be overriden by subclasses.
 *
 * @param {string} name Function name.
 */
Profile.prototype.skipThisFunction = function(name) {
  return false;
};


/**
 * Enum for profiler operations that involve looking up existing
 * code entries.
 *
 * @enum {number}
 */
Profile.Operation = {
  MOVE: 0,
  DELETE: 1,
  TICK: 2
};


/**
 * Enum for code state regarding its dynamic optimization.
 *
 * @enum {number}
 */
Profile.CodeState = {
  COMPILED: 0,
  OPTIMIZABLE: 1,
  OPTIMIZED: 2
};


/**
 * Called whenever the specified operation has failed finding a function
 * containing the specified address. Should be overriden by subclasses.
 * See the Profile.Operation enum for the list of
 * possible operations.
 *
 * @param {number} operation Operation.
 * @param {number} addr Address of the unknown code.
 * @param {number} opt_stackPos If an unknown address is encountered
 *     during stack strace processing, specifies a position of the frame
 *     containing the address.
 */
Profile.prototype.handleUnknownCode = function(
    operation, addr, opt_stackPos) {
};


/**
 * Registers a library.
 *
 * @param {string} name Code entry name.
 * @param {number} startAddr Starting address.
 * @param {number} endAddr Ending address.
 */
Profile.prototype.addLibrary = function(
    name, startAddr, endAddr) {
  var entry = new CodeMap.CodeEntry(
      endAddr - startAddr, name);
  this.codeMap_.addLibrary(startAddr, entry);
  return entry;
};


/**
 * Registers statically compiled code entry.
 *
 * @param {string} name Code entry name.
 * @param {number} startAddr Starting address.
 * @param {number} endAddr Ending address.
 */
Profile.prototype.addStaticCode = function(
    name, startAddr, endAddr) {
  var entry = new CodeMap.CodeEntry(
      endAddr - startAddr, name);
  this.codeMap_.addStaticCode(startAddr, entry);
  return entry;
};


/**
 * Registers dynamic (JIT-compiled) code entry.
 *
 * @param {string} type Code entry type.
 * @param {string} name Code entry name.
 * @param {number} start Starting address.
 * @param {number} size Code entry size.
 */
Profile.prototype.addCode = function(
    type, name, start, size) {
  var entry = new Profile.DynamicCodeEntry(size, type, name);
  this.codeMap_.addCode(start, entry);
  return entry;
};


/**
 * Registers dynamic (JIT-compiled) code entry.
 *
 * @param {string} type Code entry type.
 * @param {string} name Code entry name.
 * @param {number} start Starting address.
 * @param {number} size Code entry size.
 * @param {number} funcAddr Shared function object address.
 * @param {Profile.CodeState} state Optimization state.
 */
Profile.prototype.addFuncCode = function(
    type, name, start, size, funcAddr, state) {
  // As code and functions are in the same address space,
  // it is safe to put them in a single code map.
  var func = this.codeMap_.findDynamicEntryByStartAddress(funcAddr);
  if (!func) {
    func = new Profile.FunctionEntry(name);
    this.codeMap_.addCode(funcAddr, func);
  } else if (func.name !== name) {
    // Function object has been overwritten with a new one.
    func.name = name;
  }
  var entry = this.codeMap_.findDynamicEntryByStartAddress(start);
  if (entry) {
    if (entry.size === size && entry.func === func) {
      // Entry state has changed.
      entry.state = state;
    }
  } else {
    entry = new Profile.DynamicFuncCodeEntry(size, type, func, state);
    this.codeMap_.addCode(start, entry);
  }
  return entry;
};


/**
 * Reports about moving of a dynamic code entry.
 *
 * @param {number} from Current code entry address.
 * @param {number} to New code entry address.
 */
Profile.prototype.moveCode = function(from, to) {
  try {
    this.codeMap_.moveCode(from, to);
  } catch (e) {
    this.handleUnknownCode(Profile.Operation.MOVE, from);
  }
};


/**
 * Reports about deletion of a dynamic code entry.
 *
 * @param {number} start Starting address.
 */
Profile.prototype.deleteCode = function(start) {
  try {
    this.codeMap_.deleteCode(start);
  } catch (e) {
    this.handleUnknownCode(Profile.Operation.DELETE, start);
  }
};


/**
 * Reports about moving of a dynamic code entry.
 *
 * @param {number} from Current code entry address.
 * @param {number} to New code entry address.
 */
Profile.prototype.moveFunc = function(from, to) {
  if (this.codeMap_.findDynamicEntryByStartAddress(from)) {
    this.codeMap_.moveCode(from, to);
  }
};


/**
 * Retrieves a code entry by an address.
 *
 * @param {number} addr Entry address.
 */
Profile.prototype.findEntry = function(addr) {
  return this.codeMap_.findEntry(addr);
};


/**
 * Records a tick event. Stack must contain a sequence of
 * addresses starting with the program counter value.
 *
 * @param {Array<number>} stack Stack sample.
 */
Profile.prototype.recordTick = function(stack) {
  var processedStack = this.resolveAndFilterFuncs_(stack);
  this.bottomUpTree_.addPath(processedStack);
  processedStack.reverse();
  this.topDownTree_.addPath(processedStack);
};


/**
 * Translates addresses into function names and filters unneeded
 * functions.
 *
 * @param {Array<number>} stack Stack sample.
 */
Profile.prototype.resolveAndFilterFuncs_ = function(stack) {
  var result = [];
  for (var i = 0; i < stack.length; ++i) {
    var entry = this.codeMap_.findEntry(stack[i]);
    if (entry) {
      var name = entry.getName();
      if (!this.skipThisFunction(name)) {
        result.push(name);
      }
    } else {
      this.handleUnknownCode(
          Profile.Operation.TICK, stack[i], i);
    }
  }
  return result;
};


/**
 * Performs a BF traversal of the top down call graph.
 *
 * @param {function(CallTree.Node)} f Visitor function.
 */
Profile.prototype.traverseTopDownTree = function(f) {
  this.topDownTree_.traverse(f);
};


/**
 * Performs a BF traversal of the bottom up call graph.
 *
 * @param {function(CallTree.Node)} f Visitor function.
 */
Profile.prototype.traverseBottomUpTree = function(f) {
  this.bottomUpTree_.traverse(f);
};


/**
 * Calculates a top down profile for a node with the specified label.
 * If no name specified, returns the whole top down calls tree.
 *
 * @param {string} opt_label Node label.
 */
Profile.prototype.getTopDownProfile = function(opt_label) {
  return this.getTreeProfile_(this.topDownTree_, opt_label);
};


/**
 * Calculates a bottom up profile for a node with the specified label.
 * If no name specified, returns the whole bottom up calls tree.
 *
 * @param {string} opt_label Node label.
 */
Profile.prototype.getBottomUpProfile = function(opt_label) {
  return this.getTreeProfile_(this.bottomUpTree_, opt_label);
};


/**
 * Helper function for calculating a tree profile.
 *
 * @param {Profile.CallTree} tree Call tree.
 * @param {string} opt_label Node label.
 */
Profile.prototype.getTreeProfile_ = function(tree, opt_label) {
  if (!opt_label) {
    tree.computeTotalWeights();
    return tree;
  } else {
    var subTree = tree.cloneSubtree(opt_label);
    subTree.computeTotalWeights();
    return subTree;
  }
};


/**
 * Calculates a flat profile of callees starting from a node with
 * the specified label. If no name specified, starts from the root.
 *
 * @param {string} opt_label Starting node label.
 */
Profile.prototype.getFlatProfile = function(opt_label) {
  var counters = new CallTree();
  var rootLabel = opt_label || CallTree.ROOT_NODE_LABEL;
  var precs = {};
  precs[rootLabel] = 0;
  var root = counters.findOrAddChild(rootLabel);

  this.topDownTree_.computeTotalWeights();
  this.topDownTree_.traverseInDepth(
    function onEnter(node) {
      if (!(node.label in precs)) {
        precs[node.label] = 0;
      }
      var nodeLabelIsRootLabel = node.label == rootLabel;
      if (nodeLabelIsRootLabel || precs[rootLabel] > 0) {
        if (precs[rootLabel] == 0) {
          root.selfWeight += node.selfWeight;
          root.totalWeight += node.totalWeight;
        } else {
          var rec = root.findOrAddChild(node.label);
          rec.selfWeight += node.selfWeight;
          if (nodeLabelIsRootLabel || precs[node.label] == 0) {
            rec.totalWeight += node.totalWeight;
          }
        }
        precs[node.label]++;
      }
    },
    function onExit(node) {
      if (node.label == rootLabel || precs[rootLabel] > 0) {
        precs[node.label]--;
      }
    },
    null);

  if (!opt_label) {
    // If we have created a flat profile for the whole program, we don't
    // need an explicit root in it. Thus, replace the counters tree
    // root with the node corresponding to the whole program.
    counters.root_ = root;
  } else {
    // Propagate weights so percents can be calculated correctly.
    counters.getRoot().selfWeight = root.selfWeight;
    counters.getRoot().totalWeight = root.totalWeight;
  }
  return counters;
};


/**
 * Cleans up function entries that are not referenced by code entries.
 */
Profile.prototype.cleanUpFuncEntries = function() {
  var referencedFuncEntries = [];
  var entries = this.codeMap_.getAllDynamicEntriesWithAddresses();
  for (var i = 0, l = entries.length; i < l; ++i) {
    if (entries[i][1].constructor === Profile.FunctionEntry) {
      entries[i][1].used = false;
    }
  }
  for (var i = 0, l = entries.length; i < l; ++i) {
    if ("func" in entries[i][1]) {
      entries[i][1].func.used = true;
    }
  }
  for (var i = 0, l = entries.length; i < l; ++i) {
    if (entries[i][1].constructor === Profile.FunctionEntry &&
        !entries[i][1].used) {
      this.codeMap_.deleteCode(entries[i][0]);
    }
  }
};


/**
 * Creates a dynamic code entry.
 *
 * @param {number} size Code size.
 * @param {string} type Code type.
 * @param {string} name Function name.
 * @constructor
 */
Profile.DynamicCodeEntry = function(size, type, name) {
  CodeMap.CodeEntry.call(this, size, name);
  this.type = type;
};


/**
 * Returns node name.
 */
Profile.DynamicCodeEntry.prototype.getName = function() {
  return this.type + ': ' + this.name;
};


/**
 * Returns raw node name (without type decoration).
 */
Profile.DynamicCodeEntry.prototype.getRawName = function() {
  return this.name;
};


Profile.DynamicCodeEntry.prototype.isJSFunction = function() {
  return false;
};


Profile.DynamicCodeEntry.prototype.toString = function() {
  return this.getName() + ': ' + this.size.toString(16);
};


/**
 * Creates a dynamic code entry.
 *
 * @param {number} size Code size.
 * @param {string} type Code type.
 * @param {Profile.FunctionEntry} func Shared function entry.
 * @param {Profile.CodeState} state Code optimization state.
 * @constructor
 */
Profile.DynamicFuncCodeEntry = function(size, type, func, state) {
  CodeMap.CodeEntry.call(this, size);
  this.type = type;
  this.func = func;
  this.state = state;
};

Profile.DynamicFuncCodeEntry.STATE_PREFIX = ["", "~", "*"];

/**
 * Returns node name.
 */
Profile.DynamicFuncCodeEntry.prototype.getName = function() {
  var name = this.func.getName();
  return this.type + ': ' + Profile.DynamicFuncCodeEntry.STATE_PREFIX[this.state] + name;
};


/**
 * Returns raw node name (without type decoration).
 */
Profile.DynamicFuncCodeEntry.prototype.getRawName = function() {
  return this.func.getName();
};


Profile.DynamicFuncCodeEntry.prototype.isJSFunction = function() {
  return true;
};


Profile.DynamicFuncCodeEntry.prototype.toString = function() {
  return this.getName() + ': ' + this.size.toString(16);
};


/**
 * Creates a shared function object entry.
 *
 * @param {string} name Function name.
 * @constructor
 */
Profile.FunctionEntry = function(name) {
  CodeMap.CodeEntry.call(this, 0, name);
};


/**
 * Returns node name.
 */
Profile.FunctionEntry.prototype.getName = function() {
  var name = this.name;
  if (name.length == 0) {
    name = '<anonymous>';
  } else if (name.charAt(0) == ' ') {
    // An anonymous function with location: " aaa.js:10".
    name = '<anonymous>' + name;
  }
  return name;
};

Profile.FunctionEntry.prototype.toString = CodeMap.CodeEntry.prototype.toString;

/**
 * Constructs a call graph.
 *
 * @constructor
 */
function CallTree() {
  this.root_ = new CallTree.Node(
      CallTree.ROOT_NODE_LABEL);
};


/**
 * The label of the root node.
 */
CallTree.ROOT_NODE_LABEL = '';


/**
 * @private
 */
CallTree.prototype.totalsComputed_ = false;


/**
 * Returns the tree root.
 */
CallTree.prototype.getRoot = function() {
  return this.root_;
};


/**
 * Adds the specified call path, constructing nodes as necessary.
 *
 * @param {Array<string>} path Call path.
 */
CallTree.prototype.addPath = function(path) {
  if (path.length == 0) {
    return;
  }
  var curr = this.root_;
  for (var i = 0; i < path.length; ++i) {
    curr = curr.findOrAddChild(path[i]);
  }
  curr.selfWeight++;
  this.totalsComputed_ = false;
};


/**
 * Finds an immediate child of the specified parent with the specified
 * label, creates a child node if necessary. If a parent node isn't
 * specified, uses tree root.
 *
 * @param {string} label Child node label.
 */
CallTree.prototype.findOrAddChild = function(label) {
  return this.root_.findOrAddChild(label);
};


/**
 * Creates a subtree by cloning and merging all subtrees rooted at nodes
 * with a given label. E.g. cloning the following call tree on label 'A'
 * will give the following result:
 *
 *           <A>--<B>                                     <B>
 *          /                                            /
 *     <root>             == clone on 'A' ==>  <root>--<A>
 *          \                                            \
 *           <C>--<A>--<D>                                <D>
 *
 * And <A>'s selfWeight will be the sum of selfWeights of <A>'s from the
 * source call tree.
 *
 * @param {string} label The label of the new root node.
 */
CallTree.prototype.cloneSubtree = function(label) {
  var subTree = new CallTree();
  this.traverse(function(node, parent) {
    if (!parent && node.label != label) {
      return null;
    }
    var child = (parent ? parent : subTree).findOrAddChild(node.label);
    child.selfWeight += node.selfWeight;
    return child;
  });
  return subTree;
};


/**
 * Computes total weights in the call graph.
 */
CallTree.prototype.computeTotalWeights = function() {
  if (this.totalsComputed_) {
    return;
  }
  this.root_.computeTotalWeight();
  this.totalsComputed_ = true;
};


/**
 * Traverses the call graph in preorder. This function can be used for
 * building optionally modified tree clones. This is the boilerplate code
 * for this scenario:
 *
 * callTree.traverse(function(node, parentClone) {
 *   var nodeClone = cloneNode(node);
 *   if (parentClone)
 *     parentClone.addChild(nodeClone);
 *   return nodeClone;
 * });
 *
 * @param {function(CallTree.Node, *)} f Visitor function.
 *    The second parameter is the result of calling 'f' on the parent node.
 */
CallTree.prototype.traverse = function(f) {
  var pairsToProcess = new ConsArray();
  pairsToProcess.concat([{node: this.root_, param: null}]);
  while (!pairsToProcess.atEnd()) {
    var pair = pairsToProcess.next();
    var node = pair.node;
    var newParam = f(node, pair.param);
    var morePairsToProcess = [];
    node.forEachChild(function (child) {
        morePairsToProcess.push({node: child, param: newParam}); });
    pairsToProcess.concat(morePairsToProcess);
  }
};


/**
 * Performs an indepth call graph traversal.
 *
 * @param {function(CallTree.Node)} enter A function called
 *     prior to visiting node's children.
 * @param {function(CallTree.Node)} exit A function called
 *     after visiting node's children.
 */
CallTree.prototype.traverseInDepth = function(enter, exit) {
  function traverse(node) {
    enter(node);
    node.forEachChild(traverse);
    exit(node);
  }
  traverse(this.root_);
};


/**
 * Constructs a call graph node.
 *
 * @param {string} label Node label.
 * @param {CallTree.Node} opt_parent Node parent.
 */
CallTree.Node = function(label, opt_parent) {
  this.label = label;
  this.parent = opt_parent;
  this.children = {};
};


/**
 * Node self weight (how many times this node was the last node in
 * a call path).
 * @type {number}
 */
CallTree.Node.prototype.selfWeight = 0;


/**
 * Node total weight (includes weights of all children).
 * @type {number}
 */
CallTree.Node.prototype.totalWeight = 0;


/**
 * Adds a child node.
 *
 * @param {string} label Child node label.
 */
CallTree.Node.prototype.addChild = function(label) {
  var child = new CallTree.Node(label, this);
  this.children[label] = child;
  return child;
};


/**
 * Computes node's total weight.
 */
CallTree.Node.prototype.computeTotalWeight =
    function() {
  var totalWeight = this.selfWeight;
  this.forEachChild(function(child) {
      totalWeight += child.computeTotalWeight(); });
  return this.totalWeight = totalWeight;
};


/**
 * Returns all node's children as an array.
 */
CallTree.Node.prototype.exportChildren = function() {
  var result = [];
  this.forEachChild(function (node) { result.push(node); });
  return result;
};


/**
 * Finds an immediate child with the specified label.
 *
 * @param {string} label Child node label.
 */
CallTree.Node.prototype.findChild = function(label) {
  return this.children[label] || null;
};


/**
 * Finds an immediate child with the specified label, creates a child
 * node if necessary.
 *
 * @param {string} label Child node label.
 */
CallTree.Node.prototype.findOrAddChild = function(label) {
  return this.findChild(label) || this.addChild(label);
};


/**
 * Calls the specified function for every child.
 *
 * @param {function(CallTree.Node)} f Visitor function.
 */
CallTree.Node.prototype.forEachChild = function(f) {
  for (var c in this.children) {
    f(this.children[c]);
  }
};


/**
 * Walks up from the current node up to the call tree root.
 *
 * @param {function(CallTree.Node)} f Visitor function.
 */
CallTree.Node.prototype.walkUpToRoot = function(f) {
  for (var curr = this; curr != null; curr = curr.parent) {
    f(curr);
  }
};


/**
 * Tries to find a node with the specified path.
 *
 * @param {Array<string>} labels The path.
 * @param {function(CallTree.Node)} opt_f Visitor function.
 */
CallTree.Node.prototype.descendToChild = function(
    labels, opt_f) {
  for (var pos = 0, curr = this; pos < labels.length && curr != null; pos++) {
    var child = curr.findChild(labels[pos]);
    if (opt_f) {
      opt_f(child, pos);
    }
    curr = child;
  }
  return curr;
};
// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


/**
 * Creates a Profile View builder object.
 *
 * @param {number} samplingRate Number of ms between profiler ticks.
 * @constructor
 */
function ViewBuilder(samplingRate) {
  this.samplingRate = samplingRate;
};


/**
 * Builds a profile view for the specified call tree.
 *
 * @param {CallTree} callTree A call tree.
 * @param {boolean} opt_bottomUpViewWeights Whether remapping
 *     of self weights for a bottom up view is needed.
 */
ViewBuilder.prototype.buildView = function(
    callTree, opt_bottomUpViewWeights) {
  var head;
  var samplingRate = this.samplingRate;
  var createViewNode = this.createViewNode;
  callTree.traverse(function(node, viewParent) {
    var totalWeight = node.totalWeight * samplingRate;
    var selfWeight = node.selfWeight * samplingRate;
    if (opt_bottomUpViewWeights === true) {
      if (viewParent === head) {
        selfWeight = totalWeight;
      } else {
        selfWeight = 0;
      }
    }
    var viewNode = createViewNode(node.label, totalWeight, selfWeight, head);
    if (viewParent) {
      viewParent.addChild(viewNode);
    } else {
      head = viewNode;
    }
    return viewNode;
  });
  var view = this.createView(head);
  return view;
};


/**
 * Factory method for a profile view.
 *
 * @param {ProfileView.Node} head View head node.
 * @return {ProfileView} Profile view.
 */
ViewBuilder.prototype.createView = function(head) {
  return new ProfileView(head);
};


/**
 * Factory method for a profile view node.
 *
 * @param {string} internalFuncName A fully qualified function name.
 * @param {number} totalTime Amount of time that application spent in the
 *     corresponding function and its descendants (not that depending on
 *     profile they can be either callees or callers.)
 * @param {number} selfTime Amount of time that application spent in the
 *     corresponding function only.
 * @param {ProfileView.Node} head Profile view head.
 * @return {ProfileView.Node} Profile view node.
 */
ViewBuilder.prototype.createViewNode = function(
    funcName, totalTime, selfTime, head) {
  return new ProfileView.Node(
      funcName, totalTime, selfTime, head);
};


/**
 * Creates a Profile View object. It allows to perform sorting
 * and filtering actions on the profile.
 *
 * @param {ProfileView.Node} head Head (root) node.
 * @constructor
 */
function ProfileView(head) {
  this.head = head;
};


/**
 * Sorts the profile view using the specified sort function.
 *
 * @param {function(ProfileView.Node,
 *     ProfileView.Node):number} sortFunc A sorting
 *     functions. Must comply with Array.sort sorting function requirements.
 */
ProfileView.prototype.sort = function(sortFunc) {
  this.traverse(function (node) {
    node.sortChildren(sortFunc);
  });
};


/**
 * Traverses profile view nodes in preorder.
 *
 * @param {function(ProfileView.Node)} f Visitor function.
 */
ProfileView.prototype.traverse = function(f) {
  var nodesToTraverse = new ConsArray();
  nodesToTraverse.concat([this.head]);
  while (!nodesToTraverse.atEnd()) {
    var node = nodesToTraverse.next();
    f(node);
    nodesToTraverse.concat(node.children);
  }
};


/**
 * Constructs a Profile View node object. Each node object corresponds to
 * a function call.
 *
 * @param {string} internalFuncName A fully qualified function name.
 * @param {number} totalTime Amount of time that application spent in the
 *     corresponding function and its descendants (not that depending on
 *     profile they can be either callees or callers.)
 * @param {number} selfTime Amount of time that application spent in the
 *     corresponding function only.
 * @param {ProfileView.Node} head Profile view head.
 * @constructor
 */
ProfileView.Node = function(
    internalFuncName, totalTime, selfTime, head) {
  this.internalFuncName = internalFuncName;
  this.totalTime = totalTime;
  this.selfTime = selfTime;
  this.head = head;
  this.parent = null;
  this.children = [];
};


/**
 * Returns a share of the function's total time in application's total time.
 */
ProfileView.Node.prototype.__defineGetter__(
    'totalPercent',
    function() { return this.totalTime /
      (this.head ? this.head.totalTime : this.totalTime) * 100.0; });


/**
 * Returns a share of the function's self time in application's total time.
 */
ProfileView.Node.prototype.__defineGetter__(
    'selfPercent',
    function() { return this.selfTime /
      (this.head ? this.head.totalTime : this.totalTime) * 100.0; });


/**
 * Returns a share of the function's total time in its parent's total time.
 */
ProfileView.Node.prototype.__defineGetter__(
    'parentTotalPercent',
    function() { return this.totalTime /
      (this.parent ? this.parent.totalTime : this.totalTime) * 100.0; });


/**
 * Adds a child to the node.
 *
 * @param {ProfileView.Node} node Child node.
 */
ProfileView.Node.prototype.addChild = function(node) {
  node.parent = this;
  this.children.push(node);
};


/**
 * Sorts all the node's children recursively.
 *
 * @param {function(ProfileView.Node,
 *     ProfileView.Node):number} sortFunc A sorting
 *     functions. Must comply with Array.sort sorting function requirements.
 */
ProfileView.Node.prototype.sortChildren = function(
    sortFunc) {
  this.children.sort(sortFunc);
};
// Copyright 2011 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

/**
 * @fileoverview Log Reader is used to process log file produced by V8.
 */


/**
 * Base class for processing log files.
 *
 * @param {Array.<Object>} dispatchTable A table used for parsing and processing
 *     log records.
 * @constructor
 */
function LogReader(dispatchTable) {
  /**
   * @type {Array.<Object>}
   */
  this.dispatchTable_ = dispatchTable;

  /**
   * Current line.
   * @type {number}
   */
  this.lineNum_ = 0;

  /**
   * CSV lines parser.
   * @type {CsvParser}
   */
  this.csvParser_ = new CsvParser();
};


/**
 * Used for printing error messages.
 *
 * @param {string} str Error message.
 */
LogReader.prototype.printError = function(str) {
  // Do nothing.
};


/**
 * Processes a portion of V8 profiler event log.
 *
 * @param {string} chunk A portion of log.
 */
LogReader.prototype.processLogChunk = function(chunk) {
  this.processLog_(chunk.split('\n'));
};


/**
 * Processes a line of V8 profiler event log.
 *
 * @param {string} line A line of log.
 */
LogReader.prototype.processLogLine = function(line) {
  this.processLog_([line]);
};


/**
 * Processes stack record.
 *
 * @param {number} pc Program counter.
 * @param {number} func JS Function.
 * @param {Array.<string>} stack String representation of a stack.
 * @return {Array.<number>} Processed stack.
 */
LogReader.prototype.processStack = function(pc, func, stack) {
  var fullStack = func ? [pc, func] : [pc];
  var prevFrame = pc;
  for (var i = 0, n = stack.length; i < n; ++i) {
    var frame = stack[i];
    var firstChar = frame.charAt(0);
    if (firstChar == '+' || firstChar == '-') {
      // An offset from the previous frame.
      prevFrame += parseInt(frame, 16);
      fullStack.push(prevFrame);
    // Filter out possible 'overflow' string.
    } else if (firstChar != 'o') {
      fullStack.push(parseInt(frame, 16));
    }
  }
  return fullStack;
};


/**
 * Returns whether a particular dispatch must be skipped.
 *
 * @param {!Object} dispatch Dispatch record.
 * @return {boolean} True if dispatch must be skipped.
 */
LogReader.prototype.skipDispatch = function(dispatch) {
  return false;
};


/**
 * Does a dispatch of a log record.
 *
 * @param {Array.<string>} fields Log record.
 * @private
 */
LogReader.prototype.dispatchLogRow_ = function(fields) {
  // Obtain the dispatch.
  var command = fields[0];
  if (!(command in this.dispatchTable_)) return;

  var dispatch = this.dispatchTable_[command];

  if (dispatch === null || this.skipDispatch(dispatch)) {
    return;
  }

  // Parse fields.
  var parsedFields = [];
  for (var i = 0; i < dispatch.parsers.length; ++i) {
    var parser = dispatch.parsers[i];
    if (parser === null) {
      parsedFields.push(fields[1 + i]);
    } else if (typeof parser == 'function') {
      parsedFields.push(parser(fields[1 + i]));
    } else {
      // var-args
      parsedFields.push(fields.slice(1 + i));
      break;
    }
  }

  // Run the processor.
  dispatch.processor.apply(this, parsedFields);
};


/**
 * Processes log lines.
 *
 * @param {Array.<string>} lines Log lines.
 * @private
 */
LogReader.prototype.processLog_ = function(lines) {
  for (var i = 0, n = lines.length; i < n; ++i, ++this.lineNum_) {
    var line = lines[i];
    if (!line) {
      continue;
    }
    try {
      var fields = this.csvParser_.parseLine(line);
      this.dispatchLogRow_(fields);
    } catch (e) {
      this.printError('line ' + (this.lineNum_ + 1) + ': ' + (e.message || e));
    }
  }
};
// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


function inherits(childCtor, parentCtor) {
  childCtor.prototype.__proto__ = parentCtor.prototype;
};


function V8Profile(separateIc) {
  Profile.call(this);
  if (!separateIc) {
    this.skipThisFunction = function(name) { return V8Profile.IC_RE.test(name); };
  }
};
inherits(V8Profile, Profile);


V8Profile.IC_RE =
    /^(?:CallIC|LoadIC|StoreIC)|(?:Builtin: (?:Keyed)?(?:Call|Load|Store)IC_)/;


/**
 * A thin wrapper around shell's 'read' function showing a file name on error.
 */
function readFile(fileName) {
  try {
    return read(fileName);
  } catch (e) {
    print(fileName + ': ' + (e.message || e));
    throw e;
  }
}


/**
 * Parser for dynamic code optimization state.
 */
function parseState(s) {
  switch (s) {
  case "": return Profile.CodeState.COMPILED;
  case "~": return Profile.CodeState.OPTIMIZABLE;
  case "*": return Profile.CodeState.OPTIMIZED;
  }
  throw new Error("unknown code state: " + s);
}


function SnapshotLogProcessor() {
  LogReader.call(this, {
      'code-creation': {
          parsers: [null, parseInt, parseInt, null, 'var-args'],
          processor: this.processCodeCreation },
      'code-move': { parsers: [parseInt, parseInt],
          processor: this.processCodeMove },
      'code-delete': { parsers: [parseInt],
          processor: this.processCodeDelete },
      'function-creation': null,
      'function-move': null,
      'function-delete': null,
      'sfi-move': null,
      'snapshot-pos': { parsers: [parseInt, parseInt],
          processor: this.processSnapshotPosition }});

  V8Profile.prototype.handleUnknownCode = function(operation, addr) {
    var op = Profile.Operation;
    switch (operation) {
      case op.MOVE:
        print('Snapshot: Code move event for unknown code: 0x' +
              addr.toString(16));
        break;
      case op.DELETE:
        print('Snapshot: Code delete event for unknown code: 0x' +
              addr.toString(16));
        break;
    }
  };

  this.profile_ = new V8Profile();
  this.serializedEntries_ = [];
}
inherits(SnapshotLogProcessor, LogReader);


SnapshotLogProcessor.prototype.processCodeCreation = function(
    type, start, size, name, maybe_func) {
  if (maybe_func.length) {
    var funcAddr = parseInt(maybe_func[0]);
    var state = parseState(maybe_func[1]);
    this.profile_.addFuncCode(type, name, start, size, funcAddr, state);
  } else {
    this.profile_.addCode(type, name, start, size);
  }
};


SnapshotLogProcessor.prototype.processCodeMove = function(from, to) {
  this.profile_.moveCode(from, to);
};


SnapshotLogProcessor.prototype.processCodeDelete = function(start) {
  this.profile_.deleteCode(start);
};


SnapshotLogProcessor.prototype.processSnapshotPosition = function(addr, pos) {
  this.serializedEntries_[pos] = this.profile_.findEntry(addr);
};


SnapshotLogProcessor.prototype.processLogFile = function(fileName) {
  var contents = readFile(fileName);
  this.processLogChunk(contents);
};


SnapshotLogProcessor.prototype.getSerializedEntryName = function(pos) {
  var entry = this.serializedEntries_[pos];
  return entry ? entry.getRawName() : null;
};


function TickProcessor(
    cppEntriesProvider,
    separateIc,
    callGraphSize,
    ignoreUnknown,
    stateFilter,
    snapshotLogProcessor) {
  LogReader.call(this, {
      'shared-library': { parsers: [null, parseInt, parseInt],
          processor: this.processSharedLibrary },
      'code-creation': {
          parsers: [null, parseInt, parseInt, null, 'var-args'],
          processor: this.processCodeCreation },
      'code-move': { parsers: [parseInt, parseInt],
          processor: this.processCodeMove },
      'code-delete': { parsers: [parseInt],
          processor: this.processCodeDelete },
      'sfi-move': { parsers: [parseInt, parseInt],
          processor: this.processFunctionMove },
      'snapshot-pos': { parsers: [parseInt, parseInt],
          processor: this.processSnapshotPosition },
      'tick': {
          parsers: [parseInt, parseInt, parseInt,
                    parseInt, parseInt, 'var-args'],
          processor: this.processTick },
      'heap-sample-begin': { parsers: [null, null, parseInt],
          processor: this.processHeapSampleBegin },
      'heap-sample-end': { parsers: [null, null],
          processor: this.processHeapSampleEnd },
      // Ignored events.
      'profiler': null,
      'function-creation': null,
      'function-move': null,
      'function-delete': null,
      'heap-sample-item': null,
      // Obsolete row types.
      'code-allocate': null,
      'begin-code-region': null,
      'end-code-region': null });

  this.cppEntriesProvider_ = cppEntriesProvider;
  this.callGraphSize_ = callGraphSize;
  this.ignoreUnknown_ = ignoreUnknown;
  this.stateFilter_ = stateFilter;
  this.snapshotLogProcessor_ = snapshotLogProcessor;
  this.deserializedEntriesNames_ = [];
  var ticks = this.ticks_ =
    { total: 0, unaccounted: 0, excluded: 0, gc: 0 };

  V8Profile.prototype.handleUnknownCode = function(
      operation, addr, opt_stackPos) {
    var op = Profile.Operation;
    switch (operation) {
      case op.MOVE:
        print('Code move event for unknown code: 0x' + addr.toString(16));
        break;
      case op.DELETE:
        print('Code delete event for unknown code: 0x' + addr.toString(16));
        break;
      case op.TICK:
        // Only unknown PCs (the first frame) are reported as unaccounted,
        // otherwise tick balance will be corrupted (this behavior is compatible
        // with the original tickprocessor.py script.)
        if (opt_stackPos == 0) {
          ticks.unaccounted++;
        }
        break;
    }
  };

  this.profile_ = new V8Profile(separateIc);
  this.codeTypes_ = {};
  // Count each tick as a time unit.
  this.viewBuilder_ = new ViewBuilder(1);
  this.lastLogFileName_ = null;

  this.generation_ = 1;
  this.currentProducerProfile_ = null;
};
inherits(TickProcessor, LogReader);


TickProcessor.VmStates = {
  JS: 0,
  GC: 1,
  COMPILER: 2,
  OTHER: 3,
  EXTERNAL: 4
};


TickProcessor.CodeTypes = {
  CPP: 0,
  SHARED_LIB: 1
};
// Otherwise, this is JS-related code. We are not adding it to
// codeTypes_ map because there can be zillions of them.


TickProcessor.CALL_PROFILE_CUTOFF_PCT = 2.0;

TickProcessor.CALL_GRAPH_SIZE = 5;

/**
 * @override
 */
TickProcessor.prototype.printError = function(str) {
  print(str);
};


TickProcessor.prototype.setCodeType = function(name, type) {
  this.codeTypes_[name] = TickProcessor.CodeTypes[type];
};


TickProcessor.prototype.isSharedLibrary = function(name) {
  return this.codeTypes_[name] == TickProcessor.CodeTypes.SHARED_LIB;
};


TickProcessor.prototype.isCppCode = function(name) {
  return this.codeTypes_[name] == TickProcessor.CodeTypes.CPP;
};


TickProcessor.prototype.isJsCode = function(name) {
  return !(name in this.codeTypes_);
};


TickProcessor.prototype.processLogFile = function(fileName) {
  this.lastLogFileName_ = fileName;
  var line;
  while (line = readline()) {
    this.processLogLine(line);
  }
};


TickProcessor.prototype.processLogFileInTest = function(fileName) {
   // Hack file name to avoid dealing with platform specifics.
  this.lastLogFileName_ = 'v8.log';
  var contents = readFile(fileName);
  this.processLogChunk(contents);
};


TickProcessor.prototype.processSharedLibrary = function(
    name, startAddr, endAddr) {
  var entry = this.profile_.addLibrary(name, startAddr, endAddr);
  this.setCodeType(entry.getName(), 'SHARED_LIB');

  var self = this;
  var libFuncs = this.cppEntriesProvider_.parseVmSymbols(
      name, startAddr, endAddr, function(fName, fStart, fEnd) {
    self.profile_.addStaticCode(fName, fStart, fEnd);
    self.setCodeType(fName, 'CPP');
  });
};


TickProcessor.prototype.processCodeCreation = function(
    type, start, size, name, maybe_func) {
  name = this.deserializedEntriesNames_[start] || name;
  if (maybe_func.length) {
    var funcAddr = parseInt(maybe_func[0]);
    var state = parseState(maybe_func[1]);
    this.profile_.addFuncCode(type, name, start, size, funcAddr, state);
  } else {
    this.profile_.addCode(type, name, start, size);
  }
};


TickProcessor.prototype.processCodeMove = function(from, to) {
  this.profile_.moveCode(from, to);
};


TickProcessor.prototype.processCodeDelete = function(start) {
  this.profile_.deleteCode(start);
};


TickProcessor.prototype.processFunctionMove = function(from, to) {
  this.profile_.moveFunc(from, to);
};


TickProcessor.prototype.processSnapshotPosition = function(addr, pos) {
  if (this.snapshotLogProcessor_) {
    this.deserializedEntriesNames_[addr] =
      this.snapshotLogProcessor_.getSerializedEntryName(pos);
  }
};


TickProcessor.prototype.includeTick = function(vmState) {
  return this.stateFilter_ == null || this.stateFilter_ == vmState;
};

TickProcessor.prototype.processTick = function(pc,
                                               sp,
                                               is_external_callback,
                                               tos_or_external_callback,
                                               vmState,
                                               stack) {
  this.ticks_.total++;
  if (vmState == TickProcessor.VmStates.GC) this.ticks_.gc++;
  if (!this.includeTick(vmState)) {
    this.ticks_.excluded++;
    return;
  }
  if (is_external_callback) {
    // Don't use PC when in external callback code, as it can point
    // inside callback's code, and we will erroneously report
    // that a callback calls itself. Instead we use tos_or_external_callback,
    // as simply resetting PC will produce unaccounted ticks.
    pc = tos_or_external_callback;
    tos_or_external_callback = 0;
  } else if (tos_or_external_callback) {
    // Find out, if top of stack was pointing inside a JS function
    // meaning that we have encountered a frameless invocation.
    var funcEntry = this.profile_.findEntry(tos_or_external_callback);
    if (!funcEntry || !funcEntry.isJSFunction || !funcEntry.isJSFunction()) {
      tos_or_external_callback = 0;
    }
  }

  this.profile_.recordTick(this.processStack(pc, tos_or_external_callback, stack));
};


TickProcessor.prototype.processHeapSampleBegin = function(space, state, ticks) {
  if (space != 'Heap') return;
  this.currentProducerProfile_ = new CallTree();
};


TickProcessor.prototype.processHeapSampleEnd = function(space, state) {
  if (space != 'Heap' || !this.currentProducerProfile_) return;

  print('Generation ' + this.generation_ + ':');
  var tree = this.currentProducerProfile_;
  tree.computeTotalWeights();
  var producersView = this.viewBuilder_.buildView(tree);
  // Sort by total time, desc, then by name, desc.
  producersView.sort(function(rec1, rec2) {
      return rec2.totalTime - rec1.totalTime ||
          (rec2.internalFuncName < rec1.internalFuncName ? -1 : 1); });
  this.printHeavyProfile(producersView.head.children);

  this.currentProducerProfile_ = null;
  this.generation_++;
};


TickProcessor.prototype.printStatistics = function() {
  print('Statistical profiling result from ' + this.lastLogFileName_ +
        ', (' + this.ticks_.total +
        ' ticks, ' + this.ticks_.unaccounted + ' unaccounted, ' +
        this.ticks_.excluded + ' excluded).');

  if (this.ticks_.total == 0) return;

  // Print the unknown ticks percentage if they are not ignored.
  if (!this.ignoreUnknown_ && this.ticks_.unaccounted > 0) {
    this.printHeader('Unknown');
    this.printCounter(this.ticks_.unaccounted, this.ticks_.total);
  }

  var flatProfile = this.profile_.getFlatProfile();
  var flatView = this.viewBuilder_.buildView(flatProfile);
  // Sort by self time, desc, then by name, desc.
  flatView.sort(function(rec1, rec2) {
      return rec2.selfTime - rec1.selfTime ||
          (rec2.internalFuncName < rec1.internalFuncName ? -1 : 1); });
  var totalTicks = this.ticks_.total;
  if (this.ignoreUnknown_) {
    totalTicks -= this.ticks_.unaccounted;
  }
  // Our total time contains all the ticks encountered,
  // while profile only knows about the filtered ticks.
  flatView.head.totalTime = totalTicks;

  // Count library ticks
  var flatViewNodes = flatView.head.children;
  var self = this;
  var libraryTicks = 0;
  this.processProfile(flatViewNodes,
      function(name) { return self.isSharedLibrary(name); },
      function(rec) { libraryTicks += rec.selfTime; });
  var nonLibraryTicks = totalTicks - libraryTicks;

  this.printHeader('Shared libraries');
  this.printEntries(flatViewNodes, null,
      function(name) { return self.isSharedLibrary(name); });

  this.printHeader('JavaScript');
  this.printEntries(flatViewNodes, nonLibraryTicks,
      function(name) { return self.isJsCode(name); });

  this.printHeader('C++');
  this.printEntries(flatViewNodes, nonLibraryTicks,
      function(name) { return self.isCppCode(name); });

  this.printHeader('GC');
  this.printCounter(this.ticks_.gc, totalTicks);

  this.printHeavyProfHeader();
  var heavyProfile = this.profile_.getBottomUpProfile();
  var heavyView = this.viewBuilder_.buildView(heavyProfile);
  // To show the same percentages as in the flat profile.
  heavyView.head.totalTime = totalTicks;
  // Sort by total time, desc, then by name, desc.
  heavyView.sort(function(rec1, rec2) {
      return rec2.totalTime - rec1.totalTime ||
          (rec2.internalFuncName < rec1.internalFuncName ? -1 : 1); });
  this.printHeavyProfile(heavyView.head.children);
};


function padLeft(s, len) {
  s = s.toString();
  if (s.length < len) {
    var padLength = len - s.length;
    if (!(padLength in padLeft)) {
      padLeft[padLength] = new Array(padLength + 1).join(' ');
    }
    s = padLeft[padLength] + s;
  }
  return s;
};


TickProcessor.prototype.printHeader = function(headerTitle) {
  print('\n [' + headerTitle + ']:');
  print('   ticks  total  nonlib   name');
};


TickProcessor.prototype.printHeavyProfHeader = function() {
  print('\n [Bottom up (heavy) profile]:');
  print('  Note: percentage shows a share of a particular caller in the ' +
        'total\n' +
        '  amount of its parent calls.');
  print('  Callers occupying less than ' +
        TickProcessor.CALL_PROFILE_CUTOFF_PCT.toFixed(1) +
        '% are not shown.\n');
  print('   ticks parent  name');
};


TickProcessor.prototype.printCounter = function(ticksCount, totalTicksCount) {
  var pct = ticksCount * 100.0 / totalTicksCount;
  print('  ' + padLeft(ticksCount, 5) + '  ' + padLeft(pct.toFixed(1), 5) + '%');
};


TickProcessor.prototype.processProfile = function(
    profile, filterP, func) {
  for (var i = 0, n = profile.length; i < n; ++i) {
    var rec = profile[i];
    if (!filterP(rec.internalFuncName)) {
      continue;
    }
    func(rec);
  }
};


TickProcessor.prototype.printEntries = function(
    profile, nonLibTicks, filterP) {
  this.processProfile(profile, filterP, function (rec) {
    if (rec.selfTime == 0) return;
    var nonLibPct = nonLibTicks != null ?
        rec.selfTime * 100.0 / nonLibTicks : 0.0;
    print('  ' + padLeft(rec.selfTime, 5) + '  ' +
          padLeft(rec.selfPercent.toFixed(1), 5) + '%  ' +
          padLeft(nonLibPct.toFixed(1), 5) + '%  ' +
          rec.internalFuncName);
  });
};


TickProcessor.prototype.printHeavyProfile = function(profile, opt_indent) {
  var self = this;
  var indent = opt_indent || 0;
  var indentStr = padLeft('', indent);
  this.processProfile(profile, function() { return true; }, function (rec) {
    // Cut off too infrequent callers.
    if (rec.parentTotalPercent < TickProcessor.CALL_PROFILE_CUTOFF_PCT) return;
    print('  ' + padLeft(rec.totalTime, 5) + '  ' +
          padLeft(rec.parentTotalPercent.toFixed(1), 5) + '%  ' +
          indentStr + rec.internalFuncName);
    // Limit backtrace depth.
    if (indent < 2 * self.callGraphSize_) {
      self.printHeavyProfile(rec.children, indent + 2);
    }
    // Delimit top-level functions.
    if (indent == 0) {
      print('');
    }
  });
};


function CppEntriesProvider() {
};


CppEntriesProvider.prototype.parseVmSymbols = function(
    libName, libStart, libEnd, processorFunc) {
  this.loadSymbols(libName);

  var prevEntry;

  function addEntry(funcInfo) {
    // Several functions can be mapped onto the same address. To avoid
    // creating zero-sized entries, skip such duplicates.
    // Also double-check that function belongs to the library address space.
    if (prevEntry && !prevEntry.end &&
        prevEntry.start < funcInfo.start &&
        prevEntry.start >= libStart && funcInfo.start <= libEnd) {
      processorFunc(prevEntry.name, prevEntry.start, funcInfo.start);
    }
    if (funcInfo.end &&
        (!prevEntry || prevEntry.start != funcInfo.start) &&
        funcInfo.start >= libStart && funcInfo.end <= libEnd) {
      processorFunc(funcInfo.name, funcInfo.start, funcInfo.end);
    }
    prevEntry = funcInfo;
  }

  while (true) {
    var funcInfo = this.parseNextLine();
    if (funcInfo === null) {
      continue;
    } else if (funcInfo === false) {
      break;
    }
    if (funcInfo.start < libStart && funcInfo.start < libEnd - libStart) {
      funcInfo.start += libStart;
    }
    if (funcInfo.size) {
      funcInfo.end = funcInfo.start + funcInfo.size;
    }
    addEntry(funcInfo);
  }
  addEntry({name: '', start: libEnd});
};


CppEntriesProvider.prototype.loadSymbols = function(libName) {
};


CppEntriesProvider.prototype.parseNextLine = function() {
  return false;
};


function UnixCppEntriesProvider(nmExec) {
  this.symbols = [];
  this.parsePos = 0;
  this.nmExec = nmExec;
  this.FUNC_RE = /^([0-9a-fA-F]{8,16}) ([0-9a-fA-F]{8,16} )?[tTwW] (.*)$/;
};
inherits(UnixCppEntriesProvider, CppEntriesProvider);


UnixCppEntriesProvider.prototype.loadSymbols = function(libName) {
  this.parsePos = 0;
  try {
    this.symbols = [
      os.system(this.nmExec, ['-C', '-n', '-S', libName], -1, -1),
      os.system(this.nmExec, ['-C', '-n', '-S', '-D', libName], -1, -1)
    ];
  } catch (e) {
    // If the library cannot be found on this system let's not panic.
    this.symbols = ['', ''];
  }
};


UnixCppEntriesProvider.prototype.parseNextLine = function() {
  if (this.symbols.length == 0) {
    return false;
  }
  var lineEndPos = this.symbols[0].indexOf('\n', this.parsePos);
  if (lineEndPos == -1) {
    this.symbols.shift();
    this.parsePos = 0;
    return this.parseNextLine();
  }

  var line = this.symbols[0].substring(this.parsePos, lineEndPos);
  this.parsePos = lineEndPos + 1;
  var fields = line.match(this.FUNC_RE);
  var funcInfo = null;
  if (fields) {
    funcInfo = { name: fields[3], start: parseInt(fields[1], 16) };
    if (fields[2]) {
      funcInfo.size = parseInt(fields[2], 16);
    }
  }
  return funcInfo;
};


function MacCppEntriesProvider(nmExec) {
  UnixCppEntriesProvider.call(this, nmExec);
  // Note an empty group. It is required, as UnixCppEntriesProvider expects 3 groups.
  this.FUNC_RE = /^([0-9a-fA-F]{8,16}) ()[iItT] (.*)$/;
};
inherits(MacCppEntriesProvider, UnixCppEntriesProvider);


MacCppEntriesProvider.prototype.loadSymbols = function(libName) {
  this.parsePos = 0;
  try {
    this.symbols = [os.system(this.nmExec, ['-n', '-f', libName], -1, -1), ''];
  } catch (e) {
    // If the library cannot be found on this system let's not panic.
    this.symbols = '';
  }
};


function WindowsCppEntriesProvider() {
  this.symbols = '';
  this.parsePos = 0;
};
inherits(WindowsCppEntriesProvider, CppEntriesProvider);


WindowsCppEntriesProvider.FILENAME_RE = /^(.*)\.([^.]+)$/;


WindowsCppEntriesProvider.FUNC_RE =
    /^\s+0001:[0-9a-fA-F]{8}\s+([_\?@$0-9a-zA-Z]+)\s+([0-9a-fA-F]{8}).*$/;


WindowsCppEntriesProvider.IMAGE_BASE_RE =
    /^\s+0000:00000000\s+___ImageBase\s+([0-9a-fA-F]{8}).*$/;


// This is almost a constant on Windows.
WindowsCppEntriesProvider.EXE_IMAGE_BASE = 0x00400000;


WindowsCppEntriesProvider.prototype.loadSymbols = function(libName) {
  var fileNameFields = libName.match(WindowsCppEntriesProvider.FILENAME_RE);
  if (!fileNameFields) return;
  var mapFileName = fileNameFields[1] + '.map';
  this.moduleType_ = fileNameFields[2].toLowerCase();
  try {
    this.symbols = read(mapFileName);
  } catch (e) {
    // If .map file cannot be found let's not panic.
    this.symbols = '';
  }
};


WindowsCppEntriesProvider.prototype.parseNextLine = function() {
  var lineEndPos = this.symbols.indexOf('\r\n', this.parsePos);
  if (lineEndPos == -1) {
    return false;
  }

  var line = this.symbols.substring(this.parsePos, lineEndPos);
  this.parsePos = lineEndPos + 2;

  // Image base entry is above all other symbols, so we can just
  // terminate parsing.
  var imageBaseFields = line.match(WindowsCppEntriesProvider.IMAGE_BASE_RE);
  if (imageBaseFields) {
    var imageBase = parseInt(imageBaseFields[1], 16);
    if ((this.moduleType_ == 'exe') !=
        (imageBase == WindowsCppEntriesProvider.EXE_IMAGE_BASE)) {
      return false;
    }
  }

  var fields = line.match(WindowsCppEntriesProvider.FUNC_RE);
  return fields ?
      { name: this.unmangleName(fields[1]), start: parseInt(fields[2], 16) } :
      null;
};


/**
 * Performs very simple unmangling of C++ names.
 *
 * Does not handle arguments and template arguments. The mangled names have
 * the form:
 *
 *   ?LookupInDescriptor@JSObject@internal@v8@@...arguments info...
 */
WindowsCppEntriesProvider.prototype.unmangleName = function(name) {
  // Empty or non-mangled name.
  if (name.length < 1 || name.charAt(0) != '?') return name;
  var nameEndPos = name.indexOf('@@');
  var components = name.substring(1, nameEndPos).split('@');
  components.reverse();
  return components.join('::');
};


function ArgumentsProcessor(args) {
  this.args_ = args;
  this.result_ = ArgumentsProcessor.DEFAULTS;

  this.argsDispatch_ = {
    '-j': ['stateFilter', TickProcessor.VmStates.JS,
        'Show only ticks from JS VM state'],
    '-g': ['stateFilter', TickProcessor.VmStates.GC,
        'Show only ticks from GC VM state'],
    '-c': ['stateFilter', TickProcessor.VmStates.COMPILER,
        'Show only ticks from COMPILER VM state'],
    '-o': ['stateFilter', TickProcessor.VmStates.OTHER,
        'Show only ticks from OTHER VM state'],
    '-e': ['stateFilter', TickProcessor.VmStates.EXTERNAL,
        'Show only ticks from EXTERNAL VM state'],
    '--call-graph-size': ['callGraphSize', TickProcessor.CALL_GRAPH_SIZE,
        'Set the call graph size'],
    '--ignore-unknown': ['ignoreUnknown', true,
        'Exclude ticks of unknown code entries from processing'],
    '--separate-ic': ['separateIc', true,
        'Separate IC entries'],
    '--unix': ['platform', 'unix',
        'Specify that we are running on *nix platform'],
    '--windows': ['platform', 'windows',
        'Specify that we are running on Windows platform'],
    '--mac': ['platform', 'mac',
        'Specify that we are running on Mac OS X platform'],
    '--nm': ['nm', 'nm',
        'Specify the \'nm\' executable to use (e.g. --nm=/my_dir/nm)'],
    '--snapshot-log': ['snapshotLogFileName', 'snapshot.log',
        'Specify snapshot log file to use (e.g. --snapshot-log=snapshot.log)']
  };
  this.argsDispatch_['--js'] = this.argsDispatch_['-j'];
  this.argsDispatch_['--gc'] = this.argsDispatch_['-g'];
  this.argsDispatch_['--compiler'] = this.argsDispatch_['-c'];
  this.argsDispatch_['--other'] = this.argsDispatch_['-o'];
  this.argsDispatch_['--external'] = this.argsDispatch_['-e'];
};


ArgumentsProcessor.DEFAULTS = {
  logFileName: 'v8.log',
  snapshotLogFileName: null,
  platform: 'unix',
  stateFilter: null,
  callGraphSize: 5,
  ignoreUnknown: false,
  separateIc: false,
  nm: 'nm'
};


ArgumentsProcessor.prototype.parse = function() {
  while (this.args_.length) {
    var arg = this.args_[0];
    if (arg.charAt(0) != '-') {
      break;
    }
    this.args_.shift();
    var userValue = null;
    var eqPos = arg.indexOf('=');
    if (eqPos != -1) {
      userValue = arg.substr(eqPos + 1);
      arg = arg.substr(0, eqPos);
    }
    if (arg in this.argsDispatch_) {
      var dispatch = this.argsDispatch_[arg];
      this.result_[dispatch[0]] = userValue == null ? dispatch[1] : userValue;
    } else {
      return false;
    }
  }

  if (this.args_.length >= 1) {
      this.result_.logFileName = this.args_.shift();
  }
  return true;
};


ArgumentsProcessor.prototype.result = function() {
  return this.result_;
};


ArgumentsProcessor.prototype.printUsageAndExit = function() {

  function padRight(s, len) {
    s = s.toString();
    if (s.length < len) {
      s = s + (new Array(len - s.length + 1).join(' '));
    }
    return s;
  }

  print('Cmdline args: [options] [log-file-name]\n' +
        'Default log file name is "' +
        ArgumentsProcessor.DEFAULTS.logFileName + '".\n');
  print('Options:');
  for (var arg in this.argsDispatch_) {
    var synonims = [arg];
    var dispatch = this.argsDispatch_[arg];
    for (var synArg in this.argsDispatch_) {
      if (arg !== synArg && dispatch === this.argsDispatch_[synArg]) {
        synonims.push(synArg);
        delete this.argsDispatch_[synArg];
      }
    }
    print('  ' + padRight(synonims.join(', '), 20) + dispatch[2]);
  }
  quit(2);
};

// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// Tick Processor's code flow.

function processArguments(args) {
  var processor = new ArgumentsProcessor(args);
  if (processor.parse()) {
    return processor.result();
  } else {
    processor.printUsageAndExit();
  }
}

var entriesProviders = {
  'unix': UnixCppEntriesProvider,
  'windows': WindowsCppEntriesProvider,
  'mac': MacCppEntriesProvider
};

var params = processArguments(arguments);
var snapshotLogProcessor;
if (params.snapshotLogFileName) {
  snapshotLogProcessor = new SnapshotLogProcessor();
  snapshotLogProcessor.processLogFile(params.snapshotLogFileName);
}
var tickProcessor = new TickProcessor(
  new (entriesProviders[params.platform])(params.nm),
  params.separateIc,
  params.callGraphSize,
  params.ignoreUnknown,
  params.stateFilter,
  snapshotLogProcessor);
tickProcessor.processLogFile(params.logFileName);
tickProcessor.printStatistics();

