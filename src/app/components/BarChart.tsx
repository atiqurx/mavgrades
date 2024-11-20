"use client";

import { Bar } from "react-chartjs-2";
import { Course } from "./SideBar";
import {
   Chart as ChartJS,
   ChartOptions,
   CategoryScale,
   LinearScale,
   BarElement,
   Title as ChartTitle,
   Tooltip,
   Legend,
   ChartData,
} from "chart.js";

ChartJS.register(
   CategoryScale,
   LinearScale,
   BarElement,
   ChartTitle,
   Tooltip,
   Legend
);

// Define the props type for the BarChart component
interface BarChartProps {
   grades: Course[];
   colors: string[]; // Array of colors for each dataset
}

const BarChart: React.FC<BarChartProps> = ({ grades, colors }) => {
   // Check if grades or colors are null or empty
   if (!grades || grades.length === 0 || !colors || colors.length === 0) {
      return null; // Do not render anything
   }
   // console.log(`grades: ${JSON.stringify(grades)}`);
   // Map Tailwind CSS classes to hex codes if needed
   const tailwindColors: { [key: string]: string } = {
      "border-t-blue-400": "#60A5FA",
      "border-t-green-400": "#34D399",
      "border-t-orange-400": "#FBBF24",
      "border-t-teal-400": "#2DD4BF",
      "border-t-rose-400": "#FB7185",
      "border-t-yellow-400": "#FDE047",
      // Add more mappings if necessary
   };

   // Prepare the grade data and labels
   const gradeLabels = ["A", "B", "C", "D", "P", "I", "F", "Q", "W", "Z", "R"];

   // Create datasets for each course selection
   const datasets = grades.map((course, index) => {
      // Determine the color for this dataset
      const colorKey = colors[index % colors.length];
      const backgroundColor = tailwindColors[colorKey] || colorKey || "#57D2DD"; // Fallback to #57D2DD if color not found

      if (!course) {
         return {
            label: `Professor ${index + 1}`, // Fallback label for null courses
            data: new Array(gradeLabels.length).fill(0), // Default to an array of zeros
            backgroundColor,
            borderRadius: 7,
            borderSkipped: "bottom" as const, // Only round the top corners
         };
      }

      const gradeValues = [
         ((course.grades_A ?? 0) / course.grades_count) * 100,
         ((course.grades_B ?? 0) / course.grades_count) * 100,
         ((course.grades_C ?? 0) / course.grades_count) * 100,
         ((course.grades_D ?? 0) / course.grades_count) * 100,
         ((course.grades_P ?? 0) / course.grades_count) * 100,
         ((course.grades_I ?? 0) / course.grades_count) * 100,
         ((course.grades_F ?? 0) / course.grades_count) * 100,
         ((course.grades_Q ?? 0) / course.grades_count) * 100,
         ((course.grades_W ?? 0) / course.grades_count) * 100,
         ((course.grades_Z ?? 0) / course.grades_count) * 100,
         ((course.grades_R ?? 0) / course.grades_count) * 100,
      ];

      return {
         label: `${course.instructor1}`,
         data: gradeValues,
         backgroundColor,
         borderRadius: 7,
         borderSkipped: "bottom" as const, // Only round the top corners
      };
   });

   // Filter labels and datasets to only include those with non-zero values
   const nonZeroIndices = gradeLabels.reduce(
      (indices: number[], label, index) => {
         const hasNonZeroData = datasets.some(
            (dataset) => dataset.data[index] > 0
         );
         if (hasNonZeroData) {
            indices.push(index);
         }
         return indices;
      },
      []
   );

   const filteredLabels = nonZeroIndices.map((index) => gradeLabels[index]);
   const filteredDatasets = datasets.map((dataset) => ({
      ...dataset,
      data: nonZeroIndices.map((index) => dataset.data[index]),
   }));

   const data: ChartData<"bar", number[], string> = {
      labels: filteredLabels,
      datasets: filteredDatasets,
   };

   // Formatting the chart
   const options: ChartOptions<"bar"> = {
      responsive: true,
      scales: {
         x: {
            ticks: {
               color: "white", // X-axis labels
               font: {
                  size: 14,
               },
            },
            grid: {
               color: "rgba(255, 255, 255, 0.2)", // X-axis grid lines
            },
         },
         y: {
            ticks: {
               color: "white", // Y-axis labels
               font: {
                  size: 14,
               },
               callback: function(value) {
                  return value + '%'; // Add '%' symbol to each y-axis tick
               },
            },
            grid: {
               color: "rgba(255, 255, 255, 0.2)", // Y-axis grid lines
            },
         },
      },
      plugins: {
         legend: {
            labels: {
               color: "white", // Legend text color
               font: {
                  size: 14, // Legend font size
               },
            },
         },
         tooltip: {
            titleColor: "white",
            bodyColor: "white",
            backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark background for tooltips
            callbacks: {
               title: () => {
                  return ''; // Return an empty string to make the label blank
               },
               label: () => {
                  return ''; // Return an empty string to make the label blank
               },
               // Displays the raw student count for rach letter grade
               footer: (tooltipItems) => {
                  const datasetIndex = tooltipItems[0].datasetIndex;
                  const course = grades[datasetIndex] as Course; // Assert the type
      
                  if (!course) {
                      return; // Handle the case where the course might be null
                  }
      
                  // Define the grade label to access the correct property
                  const gradeLabel = tooltipItems[0].label; // This should correspond to 'A', 'B', etc.
                  const gradeCount = course[`grades_${gradeLabel}` as keyof Course] || 0; // Access dynamically
      
                  return `# of Students: ${gradeCount}`; // Display the raw grade count
              },
            },
         },
      },
   };
   return grades && grades.length > 0 ? (
      <div className="mt-8 bg-gray-200 bg-opacity-10 rounded-lg p-4">
         <h2
            className={`text-xl text-center font-bold mb-2 ${
               grades.length === 1
                  ? "text-blue-400" // Solid color for one course
                  : "text-transparent bg-clip-text " + 
                  (grades.length === 2
                     ? "bg-gradient-to-r from-blue-400 to-green-400" // Gradient for two courses
                     : "bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400") // Gradient for three courses
            }`}
         >
            Grades Distribution
         </h2>
      <div
      className={`rounded w-1/2 mx-auto mb-4 px-10`}
      style={{
         backgroundImage:
            grades.length === 1
               ? `none` // No gradient if there's only one course
               : grades.length === 2
               ? `linear-gradient(to right, #60A5FA, #34D399)` // Gradient for two courses
               : `linear-gradient(to right, #60A5FA, #34D399, #FBBF24)`, // Gradient for three courses
            backgroundColor: grades.length === 1 ? "#60A5FA" : undefined, // Solid color for one course
         height: '4px', 
      }}
   ></div>
      <Bar data={data} options={options} />
   </div>
   ) : null;
};

export default BarChart;
