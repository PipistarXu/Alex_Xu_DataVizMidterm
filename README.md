# Guess the Hour

**A game about what New Yorkers report to 311 at each hour of the day.**
Data Visualization midterm · theme: *Undercurrents* · built with D3.js on NYC Open Data.

Live site: `https://<your-username>.github.io/guess-the-hour/`

## The idea

Beneath the daytime city runs a night city that rarely appears in its official picture. 311, New York's line for non-emergency problems, hears both. From 11 PM to 3 AM, more than half of everything reported is noise. By 9 AM, noise falls under a tenth and the line fills with parking, trash and broken apartments. Each hour has its own fingerprint, so the game asks: if you saw only the complaints, could you tell what time it is?

## How it works

1. **Onboarding (6 short steps).** What 311 is → 3 AM is mostly noise → 10 AM sounds different → each problem's peak hour (the clues) → what the data can't show → the invitation to play. The sky behind the page changes to match each step's hour.
2. **The game (6 rounds, 20 points).** Three kinds of rounds take turns:
   - **Guess the hour:** see the category mix of one secret hour and tap that hour on a 24-hour dial (up to 4 points).
   - **Wavelength:** swing a needle to estimate a number, such as the share of noise at 1 AM (bullseye 4 points).
   - **Flashcard:** pick one of two answers and the card flips to show the numbers (2 points).
   Every question is generated from the data, so each game is different. The final screen lists what you learned.
3. **Explore the day.** A free 24-hour dial with hover details, a slider, and a Mix/Volume toggle.

## Data

- **Source:** [311 Service Requests from 2010 to Present](https://data.cityofnewyork.us/d/erm2-nwe9), NYC Open Data.
- **Scope:** every request created in 2025: 3,655,041 rows before cleaning, 3,653,118 after.
- **Profile:** `created_date`, `complaint_type` and `agency` have no missing values. `closed_date` is empty for 55,126 rows, `latitude` for 50,148, and `incident_zip` for 29,873. Those fields are not used.
- **Cleaning:** 1,923 Health Department (DOHMH) records stamped exactly 12:00:00 AM were removed. They carry a date but no real time and would make midnight look busier than it is.
- **Categories** (from `complaint_type` and `agency`): Noise (types starting with "Noise"), Heat & hot water (HEAT/HOT WATER), Parking (Illegal Parking, Blocked Driveway), Apartment repairs (other HPD requests), Trash & sanitation (DSNY), Streets, lights & signals (DOT), Homeless assistance & encampments (Encampment, Homeless Person Assistance), Water & sewer (Water System, Sewer), Everything else.
- **Reproduce it:** `data_prep.py` rebuilds `data.json` from the city's API and prints a profile. Run it in Google Colab, or locally with `pip install requests pandas` and then `python data_prep.py`. The dataset is updated daily, so a new run can differ slightly from the numbers in the game.

## Ethics and limits

- **311 counts who calls, not what happens.** Neighborhoods that trust the city less report less, so their problems look smaller here.
- **Some people appear only through others.** Requests about unhoused New Yorkers are filed by other people about them. The game keeps those as citywide hourly totals only: no locations and no individual records.
- **The hour is when a request was filed, not when the problem started.**
- **Citywide only.** Hours are pooled across all five boroughs and every day of the year, so local and weekday/weekend patterns are hidden.

## Reflection

*Draft. Edit this so it is in your own words.*

**What works**
- The night hours are easy to recognize and memorable: noise above 50% is a strong, surprising clue.
- Alternating three kinds of rounds keeps the game from feeling repetitive, and each round teaches one fact.
- The onboarding introduces the clues (each problem's peak hour) before the player needs them, so the first round isn't a blind guess.

**What doesn't work yet**
- From 9 AM to 5 PM the hours look almost the same, so guess-the-hour rounds in that window feel like luck. The game says so on the final screen, but the daytime needs better clues.
- Wavelength questions about small categories (for example, homeless assistance, which stays between 1% and 4%) are hard to estimate, because small differences barely move the needle.
- Streets, lights & signals spike at 2 PM. This has not been checked yet and may come from how one agency files requests, not from the street.
- The categories are broad. "Everything else" is still about 16% of all requests.

**Next**
- Add more specific clues (fireworks, helicopters, rodents) and filters for weekday vs. weekend and borough.
- Look into the 2 PM street-request spike.
- Test with classmates, note where people get stuck, and adjust the difficulty.
- Add a text description of the dial for screen readers.
- Submit to the NYC Open Data Project Gallery.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site: onboarding, game and explore mode. Data is built in; D3 loads from a CDN. |
| `data_prep.py` | Rebuilds the data from NYC Open Data and prints a profile. |
| `README.md` | This page. |

