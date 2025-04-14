import React from "react";

export const GradesInfoCard = () => {
   return (
      <>
         <h3 className="text-lg font-bold mb-2 text-blue-400">
            Grading Information
         </h3>
         <table className="w-full text-left text-sm text-white">
            <thead>
               <tr className="border-b">
                  <th className="pb-1">Grade</th>
                  <th className="pb-1">Description</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>A</td>
                  <td>Excellent</td>
               </tr>
               <tr>
                  <td>B</td>
                  <td>Good</td>
               </tr>
               <tr>
                  <td>C</td>
                  <td>Fair</td>
               </tr>
               <tr>
                  <td>D</td>
                  <td>Below Average</td>
               </tr>
               <tr>
                  <td>F</td>
                  <td>Failure</td>
               </tr>
               <tr>
                  <td>I</td>
                  <td>Incomplete</td>
               </tr>
               <tr>
                  <td>W</td>
                  <td>Withdrawn</td>
               </tr>
               <tr>
                  <td>Q</td>
                  <td>Withdrawn - No Penalty</td>
               </tr>
               <tr>
                  <td>P</td>
                  <td>Pass</td>
               </tr>
               <tr>
                  <td>R</td>
                  <td>Research</td>
               </tr>
               <tr>
                  <td>Z</td>
                  <td>No Credit</td>
               </tr>
            </tbody>
         </table>
      </>
   );
};
