# Study-guide source notes

Exam 1: Chapters 2–3. Exam 2: Chapter 4. Exam 3: Chapter 5. Final: Chapter 6 (former fourth exam), per the instructor’s current exam structure.

The existing live Exam 1 page is retained as exam-1.html, with a homepage link added. Its earlier source clarifications are preserved in HTML comments beside the relevant solutions.

Exam 2 uses the synced Canvas HTML and Chapter 4 TeX reference. The older HTML resets ordered-list numbering twice; the guide restores 1–63. Source entries 4, 12, 15, and 42 are intentionally omitted.

Exam 3 uses the Chapter 5 HTML and TeX. Source entries 2, 3, and 40 are intentionally omitted. All 44 other exercises have collapsible solutions; the originally exposed solution to 41 is now collapsed. Five TikZ diagrams already present in the repository were restored.

The Final includes all 62 Chapter 6 source exercises, including 58–62 missing from its HTML conversion.

All required image filenames were found with exact spelling and case in the repository. No Canvas-hosted image URL remains.

## Corrections and clarifications

- Exam 2, exercise 26: The plane gives derivatives only at P; corrected the intermediate decimal arithmetic.
- Exam 2, exercise 35: Corrected the intermediate gradient evaluation; final answer unchanged.
- Exam 2, exercise 48: Replaced heavily rounded critical-point coordinates with exact values and D=3.
- Exam 2, exercise 49: Fixed intermediate e-2e arithmetic; classification unchanged.
- Exam 2, exercise 52: Removed the out-of-domain candidate and repaired the y=1 boundary expression.
- Exam 2, exercise 59: Corrected the two-constraint extrema and points; old values did not solve the multiplier equations.
- Exam 3, exercise 1: Corrected extra Riemann-sum term and swapped midpoint coordinates; restored both existing TikZ graphics.
- Exam 3, exercise 5: Solution now uses the stated bounds 0 to 5; alternate source integral noted.
- Exam 3, exercise 8: Corrected the logarithm antiderivative; final value unchanged.
- Exam 3, exercise 10: Used the stated integrand sqrt(x)*y throughout and corrected inner integration and powers.
- Exam 3, exercise 12: Corrected sign and evaluation of the inner antiderivative.
- Exam 3, exercise 13: Corrected the second substitution coefficient; final expression unchanged.
- Exam 3, exercise 14: Replaced inconsistent logarithm algebra with the correct evaluated integral.
- Exam 3, exercise 18: Corrected the antiderivative; final answer unchanged.
- Exam 3, exercise 20: Repaired missing bounds and invalid antiderivative lines in both orders.
- Exam 3, exercise 22: Corrected integrand mismatch; answer to the actual question is pi/4.
- Exam 3, exercise 23: Printed inequalities give an unbounded region; preserved them and explained the bounded-source alternative.
- Exam 3, exercise 24: Corrected the expansion coefficients; final answer unchanged.
- Exam 3, exercise 27: Corrected inconsistent box bounds in the alternate integration order.
- Exam 3, exercise 30: Corrected the angular bounds of the cylindrical sector; flagged old diagrams.
- Exam 3, exercise 39: Repaired the substitution factor and dimensional inconsistency in the average-distance proof.
- Exam 3, exercise 41: Moved the exposed solution into a disclosure and restored its existing projection diagram.
- Exam 3, exercise 44: Repaired the determinant row separators.
- Exam 3, exercise 45: Corrected one inverse-image vertex, determinant arithmetic, and final integral pi^4/3.
- Exam 3, exercise 46: Evaluated the Jacobian at x=1 rather than y=7; repaired matrix layout.
- Exam 3, exercise 47: Repaired matrix layout and retained the correct change-of-variables calculation.
- Final, exercise 18: Corrected gradient and endpoint evaluation for the actual potential.
- Final, exercise 21: Corrected the sign of the field second component and integral.
- Final, exercise 28: Used the given negative signs in the parametrization; corrected derivatives, normal, point, and tangent plane.
- Final, exercise 29: Corrected inconsistent product factors; final result unchanged.
- Final, exercise 33: Corrected derivatives, upward normal, substituted field, and flux for the stated surface.
- Final, exercise 53: Removed conversational draft text and solved the printed field rather than substituting a different field.
- Final, exercises 58–62: restored active Divergence Theorem problems present in the TeX but missing from the HTML. Exercise 58 now uses the printed box bounds, giving 296/3, rather than 142.

Some legacy source files in OneDrive could be listed but were unreadable; equivalent synced chapter/Canvas references were used. Original source files were not modified.


## Instructor review after presentation cleanup

These points are for instructor review and are not linked from the student pages.

- **Exam 2, exercise 54:** The question asks for a maximum of xyz on the entire plane 2x+y+4z=1. There is no global maximum: (-t²,1+6t²,-t²) satisfies the constraint and xyz=t⁴(1+6t²) tends to infinity. The value 1/216 is a local maximum; it becomes the global maximum if x,y,z≥0 is added. The existing correct solution is retained. Confirm whether to add that domain restriction to the question.
- **Exam 3, exercise 23:** The printed inequalities 4-r²≥z≥10-4r² imply r≥√2 and infinite volume. The old bounded-region solution and image instead correspond to the reversed inequalities, which give volume 6π. The correct infinite-volume solution is retained; confirm which region the question should specify. The existing image remains pending that decision.
- **Exam 1, exercise 84:** Two inline references to the initial phase were missing the backslash in \phi_0. Those notation errors are fixed; the acceleration formula is unchanged.

Source clarifications and source-summary sections are now HTML comments. Supplemental exercises and omitted exercise slots retain their numbers. Topic navigation was rebuilt from the actual exercise groups. The index surface is the level set f=z−0.22(x²−y²)=0; its gradient arrow and tangent patch are computed using the same orthographic projection as the mesh.
