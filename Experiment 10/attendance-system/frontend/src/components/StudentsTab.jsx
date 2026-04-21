import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Base URL for the new StudentController endpoints
const API_BASE_URL = "http://localhost:8080/api/studntse";

export default function StudentsTab() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [studentsData, setStudentsData] = useState([]); // Now dynamic
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newSection, setNewSection] = useState("");

  // Function to fetch and group student data from the backend
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/sections`);
      setStudentsData(response.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load student data. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAssignClick = (student, currentSection) => {
    // Note: We assume the 'id' property in the student object is the database ID (Long userId).
    setSelectedStudent({ ...student, currentSection });
    setNewSection(currentSection);
  };

  const handleSectionChange = async () => {
    if (!newSection || !selectedStudent || newSection === selectedStudent.currentSection) {
      setSelectedStudent(null);
      setNewSection("");
      return;
    }
    
    // Check if the student has a valid ID before trying to update
    if (!selectedStudent.id) {
        alert("Error: Student ID is missing. Cannot update.");
        return;
    }

    try {
      // API call to update the student's section in the database
      const response = await axios.put(`${API_BASE_URL}/assign/${selectedStudent.id}`, {
        newSection: newSection,
      });

      // Clear the modal state
      setSelectedStudent(null);
      setNewSection("");
      
      // Re-fetch all data to update the UI
      fetchStudents();

      alert(`Successfully moved ${response.data.name} to section ${newSection}!`);

    } catch (error) {
      console.error("Failed to change section:", error);
      alert("Failed to update section. Please try again.");
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
        <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status"></div>
        <p className="mt-2">Loading student data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Students by Section</h2>

      {studentsData.length === 0 && !isLoading && (
        <p className="text-gray-500 text-center py-4">No students found. Run the signup API to create some users!</p>
      )}

      {studentsData.map((sec) => (
        <div key={sec.section} className="mb-4 border-b pb-2">
          <button
            className="w-full flex justify-between items-center text-left px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition"
            onClick={() => toggleSection(sec.section)}
          >
            <span className="font-medium text-gray-700">Section {sec.section} ({sec.students.length} students)</span>
            <span>{expandedSection === sec.section ? "▲" : "▼"}</span>
          </button>

          {expandedSection === sec.section && (
            <div className="mt-2 pl-4">
              {sec.students.map((student) => (
                <div
                  key={student.id}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  <button
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-150"
                    onClick={() => handleAssignClick(student, sec.section)}
                  >
                    Change Section
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Section Change Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-80">
            <h3 className="text-lg font-semibold mb-3">
              Change Section for {selectedStudent.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">Current Section: <span className="font-bold">{selectedStudent.currentSection}</span></p>

            <select
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select new section</option>
              {studentsData.map((sec) => (
                <option key={sec.section} value={sec.section}>
                  {sec.section}
                </option>
              ))}
              {/* Option for a new section not yet in the list (e.g., D, E) */}
              <option value="D">D (New Section)</option>
              <option value="E">E (New Section)</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-150"
                onClick={() => setSelectedStudent(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-150 disabled:opacity-50"
                onClick={handleSectionChange}
                disabled={!newSection || newSection === selectedStudent.currentSection}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
