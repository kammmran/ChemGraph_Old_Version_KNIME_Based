# **ChemGraph (Old Version - KNIME Based)**  

## **Introduction**  
ChemGraph is one of the most basic projects I have ever created as a web-based process flow diagram (PFD) simulator. Initially, I wanted to develop a **"Microfluidics 2D design chip simulator"** because I found very little research available on the topic. However, after extensive research, I discovered one project (which I didn't use much, so I won’t mention it here).  

Later, I joined a team for a **Green Energy Hackathon**, where we brainstormed different ideas. I proposed creating a **Weizmann process simulator** (for **IBE and ABE** processes). This led me to develop an improved version of the idea, which I then coded into a working simulator.  

I had prior experience with **KNIME** and some exposure to **ASPEN HYSYS** (though not extensively). Since I was more comfortable with KNIME, I used its notation to create process flow diagrams. However, I made several mistakes during development, which I will discuss in the **Mistakes** section.  

---

## **Why Did I Create It?**  
I am a strong supporter of **open-source software** and believe that information should be freely available.  

ASPEN HYSYS is a powerful professional tool used for designing and simulating industrial plants from scratch. However, it is **very expensive**, making it inaccessible for most students. While open-source alternatives exist, ASPEN remains the industry leader. I understand why they charge a premium, but I still believe that open-source alternatives should be available.  

By developing **ChemGraph**, I aimed to contribute to the open-source community. The project is completely **free to use, reference, and mention**. Although recognition is not necessary, I appreciate it when people respect the effort behind open-source projects.  

(However, it’s worth noting that **Uni42 Technology**, our main company, follows an **"all rights reserved"** approach.)  

---

## **Mistakes I Made**  
During the development of ChemGraph, I made several mistakes:  

1. **Lack of Competitor Research:**  
   - I didn’t properly research existing competitors or similar projects before starting.  

2. **Diagram Symbol Rights (ISO Standards):**  
   - I overlooked standard process diagram symbols supported by **ISO** regulations.  

3. **SFILES Notation:**  
   - I didn’t initially consider **SFILES notation**, which is superior to KNIME notation for applying **graph theory** to complex process diagrams.  

4. **Missing Features:**  
   - I failed to integrate a **console, menu bar, and page navigation system**, which made the simulator less user-friendly.  

---

## **The New Version**  
After extensive research and learning from my mistakes, I started developing a **new and improved version** of ChemGraph. This version incorporates:  

- **Mathematical calculations** for improved accuracy  
- **Modern notations** for better process representation  
- **SFILES notation**, which offers better graph theory integration for complex diagrams  

---

## **Vibe Coding: My Experience**  
For this project, I used **"vibe coding"** (an intuitive, rapid development approach) to build both the **frontend** and **Django backend**. Since I wasn’t very experienced with Django at the time (I had only built **4-5 small projects**), this method saved me a lot of time.  

However, I am no longer in favor of vibe coding. The main issues I faced were:  
- **Difficult maintenance**: Fixing bugs became increasingly complicated.  
- **Scalability issues**: Implementing new features became a challenge.  
- **Limited flexibility**: I couldn't fully apply my ideas without rewriting large parts of the code.  

For the **new version**, I will rely on **my own coding knowledge** instead of vibe coding. This will not only improve the project but also **help me grow as a developer**.  


