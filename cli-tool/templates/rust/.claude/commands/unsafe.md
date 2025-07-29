# Rust Unsafe Code Analysis

Analyze and work safely with unsafe Rust code, ensuring memory safety and correctness.

## Purpose

This command helps you write, review, and analyze unsafe Rust code while maintaining memory safety guarantees and following best practices.

## Usage

```
/unsafe $ARGUMENTS
```

## What this command does

1. **Analyzes unsafe code blocks** for potential issues
2. **Provides safety guidelines** for unsafe operations
3. **Demonstrates safe patterns** for common unsafe use cases
4. **Offers tools and techniques** for verification
5. **Documents safety invariants** and contracts

## Example Commands

### Basic Unsafe Operations
```rust
// Raw pointer manipulation
fn raw_pointer_example() {
    let mut x = 42;
    let raw_ptr = &mut x as *mut i32;
    
    unsafe {
        // SAFETY: `raw_ptr` is derived from a valid reference to `x`,
        // and we're the only ones accessing it
        *raw_ptr = 100;
    }
    
    println!("x = {}", x); // x = 100
}

// Calling unsafe functions
extern "C" {
    fn abs(input: i32) -> i32;
}

fn call_unsafe_function() {
    unsafe {
        // SAFETY: abs is a well-defined C function that doesn't
        // violate Rust's safety guarantees
        println!("Absolute value of -3 is: {}", abs(-3));
    }
}

// Creating raw pointers (safe)
fn create_raw_pointers() {
    let mut num = 5;
    
    // Creating raw pointers is safe
    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;
    
    // But dereferencing requires unsafe
    unsafe {
        // SAFETY: Both pointers are derived from valid references
        // and we're not violating aliasing rules
        println!("r1 is: {}", *r1);
        println!("r2 is: {}", *r2);
    }
}
```

### Memory Management Patterns
```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

struct RawBuffer {
    ptr: *mut u8,
    len: usize,
    capacity: usize,
}

impl RawBuffer {
    fn new(capacity: usize) -> Self {
        let layout = Layout::array::<u8>(capacity).unwrap();
        let ptr = unsafe {
            // SAFETY: Layout is non-zero sized and properly aligned
            alloc(layout)
        };
        
        if ptr.is_null() {
            panic!("Failed to allocate memory");
        }
        
        RawBuffer {
            ptr,
            len: 0,
            capacity,
        }
    }
    
    fn push(&mut self, byte: u8) -> Result<(), &'static str> {
        if self.len >= self.capacity {
            return Err("Buffer is full");
        }
        
        unsafe {
            // SAFETY: 
            // 1. ptr is valid (allocated in new())
            // 2. offset is within bounds (len < capacity)
            // 3. byte is a valid u8 value
            *self.ptr.add(self.len) = byte;
        }
        
        self.len += 1;
        Ok(())
    }
    
    fn get(&self, index: usize) -> Option<u8> {
        if index >= self.len {
            return None;
        }
        
        unsafe {
            // SAFETY:
            // 1. ptr is valid
            // 2. index is within bounds (checked above)
            Some(*self.ptr.add(index))
        }
    }
    
    fn as_slice(&self) -> &[u8] {
        unsafe {
            // SAFETY:
            // 1. ptr is valid for reads of `len` bytes
            // 2. ptr is properly aligned for u8
            // 3. slice will not outlive the buffer
            std::slice::from_raw_parts(self.ptr, self.len)
        }
    }
}

impl Drop for RawBuffer {
    fn drop(&mut self) {
        let layout = Layout::array::<u8>(self.capacity).unwrap();
        unsafe {
            // SAFETY: ptr was allocated with the same layout
            dealloc(self.ptr, layout);
        }
    }
}

// Usage
fn buffer_example() {
    let mut buffer = RawBuffer::new(10);
    
    for i in 0..5 {
        buffer.push(i * 10).unwrap();
    }
    
    println!("Buffer contents: {:?}", buffer.as_slice());
}
```

### FFI (Foreign Function Interface)
```rust
use std::ffi::{CStr, CString, c_char, c_int};
use std::ptr;

// C function declarations
extern "C" {
    fn strlen(s: *const c_char) -> usize;
    fn strcpy(dest: *mut c_char, src: *const c_char) -> *mut c_char;
    fn malloc(size: usize) -> *mut std::ffi::c_void;
    fn free(ptr: *mut std::ffi::c_void);
}

// Safe wrapper for strlen
fn safe_strlen(s: &CStr) -> usize {
    unsafe {
        // SAFETY: CStr guarantees null-terminated string
        strlen(s.as_ptr())
    }
}

// Safe string duplication
fn safe_strdup(s: &CStr) -> Result<CString, &'static str> {
    let len = safe_strlen(s) + 1; // +1 for null terminator
    
    let ptr = unsafe {
        // SAFETY: Allocating memory for len bytes
        malloc(len) as *mut c_char
    };
    
    if ptr.is_null() {
        return Err("Memory allocation failed");
    }
    
    unsafe {
        // SAFETY: 
        // 1. ptr is valid (just allocated)
        // 2. s.as_ptr() is valid (CStr guarantee)
        // 3. strcpy will null-terminate the result
        strcpy(ptr, s.as_ptr());
        
        // Convert back to CString for safe management
        Ok(CString::from_raw(ptr))
    }
}

// Working with C structs
#[repr(C)]
struct CPoint {
    x: f64,
    y: f64,
}

extern "C" {
    fn process_point(p: *const CPoint) -> c_int;
    fn create_point(x: f64, y: f64) -> *mut CPoint;
    fn destroy_point(p: *mut CPoint);
}

fn ffi_struct_example() {
    let point = CPoint { x: 1.0, y: 2.0 };
    
    let result = unsafe {
        // SAFETY: point is a valid CPoint struct
        process_point(&point)
    };
    
    println!("Process result: {}", result);
    
    // Working with heap-allocated C structs
    let heap_point = unsafe {
        // SAFETY: Assuming create_point properly allocates
        create_point(3.0, 4.0)
    };
    
    if !heap_point.is_null() {
        unsafe {
            // SAFETY: heap_point is valid (null-checked)
            let point_ref = &*heap_point;
            println!("Heap point: ({}, {})", point_ref.x, point_ref.y);
            
            // SAFETY: destroy_point matches create_point
            destroy_point(heap_point);
        }
    }
}
```

### Union Types
```rust
use std::mem;

#[repr(C)]
union FloatOrInt {
    f: f32,
    i: u32,
}

impl FloatOrInt {
    fn new_float(f: f32) -> Self {
        FloatOrInt { f }
    }
    
    fn new_int(i: u32) -> Self {
        FloatOrInt { i }
    }
    
    // Safe accessors with explicit tracking
    fn as_float(&self) -> f32 {
        unsafe {
            // SAFETY: Caller must ensure this was created as float
            self.f
        }
    }
    
    fn as_int(&self) -> u32 {
        unsafe {
            // SAFETY: Caller must ensure this was created as int
            self.i
        }
    }
}

// Tagged union for safer usage
enum TaggedFloatOrInt {
    Float(f32),
    Int(u32),
}

impl TaggedFloatOrInt {
    fn from_union(union_val: FloatOrInt, is_float: bool) -> Self {
        if is_float {
            TaggedFloatOrInt::Float(unsafe { union_val.f })
        } else {
            TaggedFloatOrInt::Int(unsafe { union_val.i })
        }
    }
    
    fn to_bits(&self) -> u32 {
        match self {
            TaggedFloatOrInt::Float(f) => f.to_bits(),
            TaggedFloatOrInt::Int(i) => *i,
        }
    }
}

fn union_example() {
    let float_union = FloatOrInt::new_float(3.14);
    let int_union = FloatOrInt::new_int(42);
    
    println!("Float as bits: {}", unsafe { float_union.i });
    println!("Int as float: {}", unsafe { int_union.f });
    
    // Safer tagged version
    let tagged_float = TaggedFloatOrInt::Float(3.14);
    println!("Tagged float bits: {}", tagged_float.to_bits());
}
```

### Transmutation and Type Punning
```rust
use std::mem;

// Safe transmutation patterns
fn safe_transmute_example() {
    // Same size, compatible layout
    let bytes: [u8; 4] = [0x12, 0x34, 0x56, 0x78];
    let as_u32: u32 = unsafe {
        // SAFETY: u32 and [u8; 4] have same size and alignment
        mem::transmute(bytes)
    };
    println!("Bytes as u32: 0x{:08x}", as_u32);
    
    // Using from_ne_bytes (safer alternative)
    let safe_u32 = u32::from_ne_bytes(bytes);
    println!("Safe conversion: 0x{:08x}", safe_u32);
}

// Array to pointer transmutation
fn array_to_ptr_example() {
    let array = [1, 2, 3, 4, 5];
    
    // Unsafe way (not recommended)
    let ptr: *const i32 = unsafe {
        mem::transmute(&array)
    };
    
    // Safe way (preferred)
    let safe_ptr = array.as_ptr();
    
    unsafe {
        // SAFETY: Both pointers are valid
        println!("Unsafe ptr: {}", *ptr);
        println!("Safe ptr: {}", *safe_ptr);
    }
}

// Function pointer transmutation
type FnPtr = fn(i32) -> i32;

fn double(x: i32) -> i32 { x * 2 }
fn triple(x: i32) -> i32 { x * 3 }

fn function_ptr_example() {
    let fn_ptr: FnPtr = double;
    
    // Converting to raw pointer
    let raw_ptr: *const () = unsafe {
        // SAFETY: Function pointers can be converted to raw pointers
        mem::transmute(fn_ptr)
    };
    
    // Converting back
    let restored_fn: FnPtr = unsafe {
        // SAFETY: raw_ptr came from a valid function pointer
        mem::transmute(raw_ptr)
    };
    
    println!("Result: {}", restored_fn(5));
}
```

### Memory Layout and Alignment
```rust
use std::mem::{align_of, size_of, offset_of};
use std::ptr::addr_of;

#[repr(C)]
struct AlignedStruct {
    a: u8,      // 1 byte
    b: u32,     // 4 bytes, needs 4-byte alignment
    c: u16,     // 2 bytes
    d: u64,     // 8 bytes, needs 8-byte alignment
}

#[repr(packed)]
struct PackedStruct {
    a: u8,
    b: u32,
    c: u16,
    d: u64,
}

fn memory_layout_example() {
    println!("AlignedStruct:");
    println!("  Size: {} bytes", size_of::<AlignedStruct>());
    println!("  Alignment: {} bytes", align_of::<AlignedStruct>());
    
    println!("PackedStruct:");
    println!("  Size: {} bytes", size_of::<PackedStruct>());
    println!("  Alignment: {} bytes", align_of::<PackedStruct>());
    
    let aligned = AlignedStruct {
        a: 1, b: 2, c: 3, d: 4
    };
    
    // Safe field offset calculation
    unsafe {
        let base_ptr = &aligned as *const AlignedStruct as *const u8;
        let a_offset = addr_of!(aligned.a) as *const u8;
        let b_offset = addr_of!(aligned.b) as *const u8;
        let c_offset = addr_of!(aligned.c) as *const u8;
        let d_offset = addr_of!(aligned.d) as *const u8;
        
        println!("Field offsets:");
        println!("  a: {}", a_offset.offset_from(base_ptr));
        println!("  b: {}", b_offset.offset_from(base_ptr));
        println!("  c: {}", c_offset.offset_from(base_ptr));
        println!("  d: {}", d_offset.offset_from(base_ptr));
    }
}
```

### Unsafe Traits
```rust
// Unsafe trait implementation
unsafe trait UnsafeTrait {
    unsafe fn dangerous_method(&self);
}

struct SafeStruct {
    data: i32,
}

// SAFETY: SafeStruct properly implements the safety requirements
// of UnsafeTrait by ensuring data is always valid
unsafe impl UnsafeTrait for SafeStruct {
    unsafe fn dangerous_method(&self) {
        // SAFETY: self.data is always valid i32
        println!("Data: {}", self.data);
    }
}

// Send and Sync traits
struct MyStruct {
    ptr: *mut i32,
}

// SAFETY: MyStruct can be safely sent between threads
// because it doesn't contain any non-Send types
unsafe impl Send for MyStruct {}

// SAFETY: MyStruct can be safely shared between threads
// because all access to ptr is properly synchronized
unsafe impl Sync for MyStruct {}

impl MyStruct {
    fn new(value: i32) -> Self {
        let boxed = Box::new(value);
        MyStruct {
            ptr: Box::into_raw(boxed),
        }
    }
    
    fn get(&self) -> i32 {
        unsafe {
            // SAFETY: ptr is valid (allocated in new()) and properly aligned
            *self.ptr
        }
    }
}

impl Drop for MyStruct {
    fn drop(&mut self) {
        unsafe {
            // SAFETY: ptr was created by Box::into_raw
            let _ = Box::from_raw(self.ptr);
        }
    }
}
```

### Static Variables and Initialization
```rust
use std::sync::{Mutex, Once};

// Static with unsafe initialization
static mut COUNTER: i32 = 0;
static INIT: Once = Once::new();

fn unsafe_static_example() {
    unsafe {
        // SAFETY: We're the only ones accessing COUNTER
        // This is generally not recommended - use Mutex instead
        COUNTER += 1;
        println!("Unsafe counter: {}", COUNTER);
    }
}

// Safe static with Mutex
static SAFE_COUNTER: Mutex<i32> = Mutex::new(0);

fn safe_static_example() {
    let mut counter = SAFE_COUNTER.lock().unwrap();
    *counter += 1;
    println!("Safe counter: {}", *counter);
}

// Lazy initialization
static mut EXPENSIVE_RESOURCE: Option<Vec<i32>> = None;

fn get_expensive_resource() -> &'static Vec<i32> {
    unsafe {
        INIT.call_once(|| {
            // SAFETY: call_once ensures this runs exactly once
            EXPENSIVE_RESOURCE = Some(vec![1, 2, 3, 4, 5]);
        });
        
        // SAFETY: EXPENSIVE_RESOURCE is guaranteed to be Some
        // after call_once completes
        EXPENSIVE_RESOURCE.as_ref().unwrap()
    }
}
```

### Safety Documentation and Patterns
```rust
/// A safe wrapper around unsafe operations
/// 
/// # Safety
/// 
/// This struct maintains the following invariants:
/// - `ptr` is always valid and points to allocated memory
/// - `len` never exceeds `capacity`
/// - Memory is properly aligned for `T`
pub struct SafeWrapper<T> {
    ptr: *mut T,
    len: usize,
    capacity: usize,
}

impl<T> SafeWrapper<T> {
    /// Creates a new SafeWrapper with the given capacity
    /// 
    /// # Panics
    /// 
    /// Panics if capacity is 0 or if allocation fails
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "Capacity must be greater than 0");
        
        let layout = std::alloc::Layout::array::<T>(capacity)
            .expect("Layout calculation failed");
        
        let ptr = unsafe {
            std::alloc::alloc(layout) as *mut T
        };
        
        if ptr.is_null() {
            panic!("Memory allocation failed");
        }
        
        SafeWrapper {
            ptr,
            len: 0,
            capacity,
        }
    }
    
    /// Pushes an item to the wrapper
    /// 
    /// # Errors
    /// 
    /// Returns an error if the wrapper is at capacity
    pub fn push(&mut self, item: T) -> Result<(), T> {
        if self.len >= self.capacity {
            return Err(item);
        }
        
        unsafe {
            // SAFETY: 
            // - ptr is valid (allocated in new())
            // - offset is within bounds (len < capacity)
            // - We're not reading uninitialized memory
            self.ptr.add(self.len).write(item);
        }
        
        self.len += 1;
        Ok(())
    }
    
    /// Gets an item by index
    /// 
    /// # Safety
    /// 
    /// Caller must ensure index is less than len
    pub unsafe fn get_unchecked(&self, index: usize) -> &T {
        // SAFETY: Caller guarantees index is valid
        &*self.ptr.add(index)
    }
    
    /// Gets an item by index (safe version)
    pub fn get(&self, index: usize) -> Option<&T> {
        if index >= self.len {
            None
        } else {
            unsafe {
                // SAFETY: We just checked the bounds
                Some(self.get_unchecked(index))
            }
        }
    }
}

impl<T> Drop for SafeWrapper<T> {
    fn drop(&mut self) {
        // Drop all items
        for i in 0..self.len {
            unsafe {
                // SAFETY: All items from 0..len are initialized
                std::ptr::drop_in_place(self.ptr.add(i));
            }
        }
        
        // Deallocate memory
        let layout = std::alloc::Layout::array::<T>(self.capacity)
            .expect("Layout calculation failed");
        
        unsafe {
            // SAFETY: ptr was allocated with this layout
            std::alloc::dealloc(self.ptr as *mut u8, layout);
        }
    }
}

// SAFETY: SafeWrapper is Send if T is Send
unsafe impl<T: Send> Send for SafeWrapper<T> {}

// SAFETY: SafeWrapper is Sync if T is Sync
unsafe impl<T: Sync> Sync for SafeWrapper<T> {}
```

### Testing Unsafe Code
```rust
#[cfg(test)]
mod unsafe_tests {
    use super::*;

    #[test]
    fn test_raw_buffer() {
        let mut buffer = RawBuffer::new(5);
        
        // Test normal operations
        assert!(buffer.push(10).is_ok());
        assert!(buffer.push(20).is_ok());
        assert_eq!(buffer.get(0), Some(10));
        assert_eq!(buffer.get(1), Some(20));
        assert_eq!(buffer.get(2), None);
        
        // Test capacity limit
        for i in 0..3 {
            assert!(buffer.push(i).is_ok());
        }
        assert!(buffer.push(99).is_err());
    }
    
    #[test]
    fn test_safe_wrapper() {
        let mut wrapper = SafeWrapper::<i32>::new(3);
        
        assert!(wrapper.push(1).is_ok());
        assert!(wrapper.push(2).is_ok());
        assert!(wrapper.push(3).is_ok());
        assert!(wrapper.push(4).is_err());
        
        assert_eq!(wrapper.get(0), Some(&1));
        assert_eq!(wrapper.get(1), Some(&2));
        assert_eq!(wrapper.get(2), Some(&3));
        assert_eq!(wrapper.get(3), None);
    }
    
    #[test]
    fn test_memory_layout() {
        assert_eq!(size_of::<AlignedStruct>(), 24); // With padding
        assert_eq!(size_of::<PackedStruct>(), 15);  // Without padding
    }
    
    // Property-based testing with unsafe code
    #[cfg(feature = "proptest")]
    use proptest::prelude::*;
    
    #[cfg(feature = "proptest")]
    proptest! {
        #[test]
        fn test_buffer_push_get(values in prop::collection::vec(0u8..255, 0..10)) {
            let mut buffer = RawBuffer::new(values.len().max(1));
            
            for &value in &values {
                buffer.push(value).unwrap();
            }
            
            for (i, &expected) in values.iter().enumerate() {
                assert_eq!(buffer.get(i), Some(expected));
            }
        }
    }
}
```

## Safety Guidelines

### Documentation Requirements
1. **Document safety requirements** in comments
2. **Explain invariants** maintained by unsafe code
3. **Justify each unsafe block** with SAFETY comments
4. **Document panic conditions** and error cases
5. **Specify thread safety** guarantees

### Code Review Checklist
- [ ] All unsafe blocks have SAFETY comments
- [ ] Safety invariants are clearly documented
- [ ] Memory allocation/deallocation is balanced
- [ ] Pointer arithmetic is bounds-checked
- [ ] Aliasing rules are followed
- [ ] Thread safety is properly handled
- [ ] FFI calls are safe
- [ ] Union access is tracked correctly

### Testing Strategy
- Use Miri for undefined behavior detection
- Property-based testing for unsafe operations
- Stress testing with concurrent access
- Valgrind or AddressSanitizer for memory errors
- Fuzzing for FFI interfaces

### Tools for Unsafe Code
- **Miri**: Interpreter for detecting undefined behavior
- **cargo-careful**: Additional checks for unsafe code
- **AddressSanitizer**: Memory error detection
- **Valgrind**: Memory debugging and profiling
- **cargo-geiger**: Counts unsafe usage in dependencies

## Best Practices

### Minimize Unsafe Code
- Use safe alternatives when possible
- Encapsulate unsafe code in safe APIs
- Prefer standard library types over raw pointers
- Use existing crates for common unsafe patterns

### Memory Safety
- Always check for null pointers
- Validate array bounds
- Match allocation with deallocation
- Avoid use-after-free bugs
- Handle alignment requirements

### Concurrency Safety
- Use proper synchronization primitives
- Document thread safety guarantees
- Test with thread sanitizer
- Avoid data races

### FFI Safety
- Validate C string inputs
- Handle null pointers from C code
- Match C memory management conventions
- Use repr(C) for struct compatibility
- Document calling conventions