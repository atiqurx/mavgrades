import json
import sqlite3
from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.firefox import GeckoDriverManager
from selenium.common.exceptions import TimeoutException
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup
import time
import re
from fuzzywuzzy import fuzz



# read professors from JSON file
def read_professors_from_json(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['professors']

# Function to create or connect to the database and create the necessary tables
def create_db(db_name="professors.db"):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")

    # Create professors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS professors (
            id TEXT PRIMARY KEY,
            name TEXT,
            rmp_name TEXT,  -- New column to store the RMP name
            url TEXT,
            department TEXT,
            quality_rating TEXT,
            difficulty_rating TEXT,
            total_ratings TEXT,
            would_take_again TEXT,
            tags TEXT
        )
    ''')

    # Create skipped_profs table to store names of skipped professors
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skipped_profs (
            name TEXT PRIMARY KEY
        )
    ''')

    conn.commit()
    conn.close()

# Function to get the last processed professor from the database
def get_last_processed_professor(db_name="professors.db"):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM professors ORDER BY rowid DESC LIMIT 1")
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

# Function to normalize the name by removing any initials or middle names
def normalize_name(name):
    name = name.strip().lower()
    
    # Handle cases where first names may be initials (e.g., "A." should be treated as "A")
    name_parts = name.split()
    
    # If the first part is an initial (e.g., "A."), treat it as just the letter
    if len(name_parts) > 1 and len(name_parts[0]) == 1 and name_parts[0].endswith('.'):
        name_parts[0] = name_parts[0][0]  # Remove dot to normalize it (e.g., "A." -> "A")

    # If the name has a middle name or part, we can choose to ignore it
    return ' '.join(name_parts)

# # Function to compare names more flexibly
def compare_names(name1, name2):
    name1 = normalize_name(name1)  # Normalize the first name
    name2 = normalize_name(name2)  # Normalize the second name

    name1_parts = name1.split()  # Split name into parts
    name2_parts = name2.split()  # Split name into parts

    # Match first and last names at a minimum (allow flexibility for initials)
    if name1_parts[0] == name2_parts[0] and name1_parts[-1] == name2_parts[-1]:
        return True
    else:
        return False

# Use this function to compare names with fuzzywuzzy (more flexible)
# def compare_names(name1, name2, threshold=80):
#     """
#     Compare two names using fuzzywuzzy for a more flexible comparison.
#     """
#     name1 = normalize_name(name1)  # Normalize the first name
#     name2 = normalize_name(name2)  # Normalize the second name


#     # Use fuzzywuzzy's ratio method to calculate the similarity between names
#     similarity_score = fuzz.ratio(name1, name2)

#     # Print the similarity score for debugging
#     print(f"Similarity Score: {similarity_score}")

#     # If the similarity score exceeds the threshold, consider the names as a match
#     if similarity_score >= threshold:
#         print(f"Names are a match! (Score >= {threshold})")
#         return True
#     else:
#         print(f"Names are not a match. (Score < {threshold})")
#         return False


# Function to get professor information from the search page
def get_professor_info(prof_name, driver):
    print(f"\n\n===Searching for {prof_name}===")

    search_url = f"https://www.ratemyprofessors.com/search/professors/1343?q={prof_name.replace(' ', '+')}"
    driver.get(search_url)

    try:
        # try to wait for at least one card to appear
        WebDriverWait(driver, 8).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "a[class^='TeacherCard__StyledTeacherCard']")
            )
        )
    except TimeoutException:
        # nothing showed up within 8s — skip this professor
        print(f"No results for {prof_name}, moving on.")
        insert_skipped_professor(prof_name)
        return None
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Find all professor profiles on the page
    professors = soup.find_all('a', {'class': 'TeacherCard__StyledTeacherCard-syjs0d-0'})
    
    # If no professors are found, insert the name into skipped_profs table
    if not professors:
        print(f"Professor {prof_name} not found in search results.")
        insert_skipped_professor(prof_name)
        return None
    
    # Check each professor and compare the name
    for professor in professors:
        # Extract professor's name
        professor_name = professor.find('div', {'class': 'CardName__StyledCardName-sc-1gyrgim-0'}).text.strip()
        
        # First check name match before checking the school
        if not compare_names(prof_name, professor_name):
            continue  # Skip if names don't match
        
        # Extract the school name from the div
        school_div = professor.find('div', {'class': 'CardSchool__School-sc-19lmz2k-1 bjvHvb'})
        if school_div:
            school_name = school_div.text.strip()
            print(f"School name found: {school_name}")
            if 'University of Texas at Arlington' not in school_name:
                print(f"Skipping {professor_name}: Not from University of Texas at Arlington.")
                # Insert the skipped professor into the skipped_profs table
                insert_skipped_professor(professor_name)
                continue  # Skip this professor if not from UTA
        else:
            print(f"School info not found for {professor_name}")
            # Insert the skipped professor into the skipped_profs table
            insert_skipped_professor(professor_name)
            continue  # Skip this professor if no school info is found
        
        print(f"Found matching professor: {professor_name} at {school_name}")
        profile_url = f"https://www.ratemyprofessors.com{professor['href']}"
        return get_professor_details(profile_url, professor_name, driver)
    
    print(f"Professor {prof_name} not found in search results.")
    insert_skipped_professor(prof_name)  # Ensure skipped name is added if no match
    return None

# Function to insert skipped professor into skipped_profs table
def insert_skipped_professor(prof_name, db_name="professors.db"):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO skipped_profs (name) VALUES (?)
    ''', (prof_name,))
    
    conn.commit()
    conn.close()
    print(f"Professor {prof_name} added to skipped list.")


# Function to get detailed professor information from the professor's page
def get_professor_details(url, rmp_name, driver):
    driver.get(url)
    WebDriverWait(driver, 3).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div.RatingValue__Numerator-qw8sqy-2"))
    )
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    professor_id = url.split('/')[-1]

    # Extract department information
    dept_tag = soup.select_one("a[class^='TeacherDepartment__StyledDepartmentLink'] b")
    if dept_tag:
        department = dept_tag.get_text(strip=True)
        department = department.replace("department", "")
    else:
        department = "No department found"
    
    # Extract quality rating
    try:
        quality_rating = soup.find('div', {'class': 'RatingValue__Numerator-qw8sqy-2'}).text.strip()
    except AttributeError:
        quality_rating = "No quality rating found"
    
    # Extract total number of ratings
    try:
        total_ratings = soup.find('div', {'class': 'RatingValue__NumRatings-qw8sqy-0'}).find('a').text.strip().split()[0]
    except AttributeError:
        total_ratings = "No total ratings found"
    
    # Default placeholders
    difficulty_rating = "No difficulty rating found"
    would_take_again   = "No feedback found"

    # Loop over the two FeedbackItem blocks
    for block in soup.select("div.FeedbackItem__StyledFeedbackItem-uof32n-0"):
        num_tag   = block.select_one("div.FeedbackItem__FeedbackNumber-uof32n-1")
        desc_tag  = block.select_one("div.FeedbackItem__FeedbackDescription-uof32n-2")
        if not num_tag or not desc_tag:
            continue

        num  = num_tag.get_text(strip=True)
        desc = desc_tag.get_text(strip=True).lower()

        if desc.startswith("would take again"):
            would_take_again = num
        elif desc.startswith("level of difficulty"):
            difficulty_rating = num

    # Extract tags
    try:
        tags = [tag.text.strip() for tag in soup.find('div', {'class': 'TeacherTags__TagsContainer-sc-16vmh1y-0 kJSpQS'}).find_all('span', {'class': 'Tag-bs9vf4-0 bmtbjB'})]
    except AttributeError:
        tags = []
    
    tags = list(set(tags))
    
    return {
        'Professor_ID': professor_id,
        'Professor_URL': url,
        'Department': department,
        'Quality_Rating': quality_rating,
        'Difficulty_Rating': difficulty_rating,
        'Total_Ratings': total_ratings,
        'Would_Take_Again': would_take_again,
        'Tags': tags,
        'RMP_Name': rmp_name # name used in the rmp site
    }

# Function to save professor information to the database
def save_professor_to_db(professor_name, professor_info, db_name="professors.db"):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    # Log the SQL query being executed
    query = '''
        INSERT OR REPLACE INTO professors (id, name, rmp_name, url, department, quality_rating, difficulty_rating, total_ratings, would_take_again, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''
    
    # Insert or replace the professor data
    cursor.execute(query, (
        professor_info['Professor_ID'],
        professor_name,  # Use the name from the JSON file instead of extracted name
        professor_info['RMP_Name'],  # Store the RMP name
        professor_info['Professor_URL'],
        professor_info['Department'],
        professor_info['Quality_Rating'],
        professor_info['Difficulty_Rating'],
        professor_info['Total_Ratings'],
        professor_info['Would_Take_Again'],
        ', '.join(professor_info['Tags'])
    ))

    # Commit the transaction
    conn.commit()

    # Debug: Confirm that the commit has been made
    print(f"Committed {professor_name} to database.")
    
    # Check if the professor was successfully inserted
    cursor.execute("SELECT * FROM professors WHERE id = ?", (professor_info['Professor_ID'],))
    result = cursor.fetchone()
    if result:
        print(f"Professor {professor_name} successfully inserted: {result}")
    else:
        print(f"Failed to insert {professor_name}")

    # Close the database connection
    conn.close()


DRIVER_PATH = GeckoDriverManager().install()

BASE_OPTS = Options()
BASE_OPTS.headless = True
BASE_OPTS.page_load_strategy = "eager"

def make_driver():
    d = webdriver.Firefox(service=Service(DRIVER_PATH), options=BASE_OPTS)
    d.implicitly_wait(5)
    return d

def scrape_and_save(prof_name):
    driver = make_driver()
    try:
        info = get_professor_info(prof_name, driver)
        if info:
            save_professor_to_db(prof_name, info)
            return f"[OK] {prof_name}"
        return f"[SKIP] {prof_name}"
    finally:
        driver.quit()

def main():
    professors = read_professors_from_json('professors-test.json')
    create_db() 
    last = get_last_processed_professor()
    to_scrape = professors[professors.index(last)+1:] if last in professors else professors

    start = time.time()
    with ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(scrape_and_save, to_scrape):
            print(result)
    print(f"All done in {time.time() - start:.2f}s")

if __name__ == "__main__":
    main()
