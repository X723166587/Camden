export type Course = "entree" | "main" | "dessert";
export type Station = "entrance" | "mains" | "dessert";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  course: Course;
  station: Station;
  popular?: boolean;
  dietary?: string[];
};

type DishRow = [name: string, price: number, description?: string, popular?: boolean];
const slug = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function section(category: string, course: Course, rows: DishRow[]): MenuItem[] {
  const station: Station = course === "entree" ? "entrance" : course === "dessert" ? "dessert" : "mains";
  return rows.map(([name, price, description, popular]) => ({ id: slug(`${category}-${name}`), name, price, description, category, course, station, popular }));
}

export const MENU: MenuItem[] = [
  ...section("Chef's suggestions", "main", [
    ["San Choy Bow", 21, "Fine minced pork, water chestnuts, bamboo shoot & mushroom", true],
    ["Lemon Chicken Fillet", 22, "Crisp chicken fillet with delicate lemon sauce", true],
    ["Mongolian Lamb", 25, "Tender lamb, garlic and Mongolian sauce", true],
    ["Strip Steak Peking Style", 22, "Tender fillet, Chinese rose wine and Peking sauce"],
    ["Cajun Chicken", 22, "Golden chicken breast with Cajun flavours"],
    ["Steamed Barramundi", 26, "Ginger, shallot and soy sauce", true],
    ["Sweet & Chilli Chicken", 22, "Light batter with Thai sweet chilli sauce"],
    ["Salt & Pepper Calamari", 25, "Fresh calamari with salted chilli and pepper", true],
    ["Pepper Steak Chinese Style", 26, "Eye fillet, rose wine and black pepper sauce"],
  ]),
  ...section("Entrée", "entree", [
    ["Dim Sim", 10, "Steamed or fried · 6 per serving", true], ["Spring Roll", 10, "6 per serving", true],
    ["Prawn Toast", 10, "6 per serving"], ["Ham & Chicken Roll", 15, "6 per serving"], ["Fried Scallops", 14, "8 per serving"],
    ["Prawn Cutlet", 21, "6 per serving"], ["Curry Puff", 10, "4 per serving"], ["Prawn Gao Gee", 10, "Steamed or fried · 4 per serving"],
    ["Mixed Entree", 12, "Spring roll, dim sim, prawn toast & prawn cutlet", true],
  ]),
  ...section("Soup", "entree", [
    ["Sweet & Chilli Soup", 8], ["Chicken & Sweet Corn Soup", 8, undefined, true], ["Crab Meat & Sweet Corn Soup", 8],
    ["Long Soup", 8], ["Short Soup", 9], ["Long & Short Soup", 12], ["Combination Long & Short Soup", 22],
    ["Tom Yum Goong Soup", 12, "King prawns & mushroom in hot and sour flavour", true], ["Creamy Seafood Soup", 12],
  ]),
  ...section("Chicken", "main", [
    ["Braised Chicken with Cashews", 22], ["Braised Chicken with Vegetables", 22], ["Chicken Teriyaki", 22],
    ["Grilled Chicken in Oyster Sauce", 22], ["Grilled Chicken in Satay Sauce", 22], ["Honey Chicken", 22, undefined, true],
    ["Curry Chicken", 22], ["Szechuan Chilli Chicken", 22], ["Chicken in Honey & Pepper Sauce", 22],
    ["Chicken in Plum Sauce", 22], ["Chicken in Black Bean Sauce", 22], ["Chicken in Special BBQ Sauce", 22],
    ["Thai Lemon Chicken", 22], ["Chicken Fillet with Garlic & Butter", 23],
  ]),
  ...section("Beef", "main", [
    ["Braised Beef with Cashews", 22], ["Mongolian Beef", 22, undefined, true], ["Braised Beef with Vegetables", 22],
    ["Braised Beef in Chilli Sauce", 22], ["Braised Beef in Black Bean Sauce", 22], ["Beef in Honey & Pepper Sauce", 22],
    ["Beef in Special BBQ Sauce", 22], ["Beef in Plum Sauce", 22], ["Beef in Oyster Sauce", 22], ["Curry Beef", 22], ["Szechuan Chilli Beef", 22],
  ]),
  ...section("Pork", "main", [
    ["BBQ Pork in Plum Sauce", 22], ["Pork Ribs in Teriyaki Sauce", 22], ["Szechuan Chilli Pork Ribs", 22],
    ["Salt & Pepper Pork Ribs", 22, undefined, true], ["Pork Ribs in Peking Sauce", 22], ["Pork Ribs in Plum Sauce", 22],
    ["Pork Ribs in Special BBQ Sauce", 22], ["Pork Ribs in Satay Sauce", 22],
  ]),
  ...section("Hot Plate", "main", [
    ["Beef & Chicken Black Bean", 23], ["Garlic King Prawn", 26], ["Garlic Chicken", 23], ["Fillet Steak in Oyster Sauce", 26],
    ["Fillet Steak in Peking Sauce", 26], ["Satay Combination", 23], ["Satay Seafood Combination", 26],
    ["Chicken Fillet in Creamy Pepper", 23], ["Beef Fillet in Creamy Pepper", 23],
  ]),
  ...section("Seafood", "main", [
    ["Satay King Prawn", 26], ["Satay Beef", 23], ["Satay Chicken", 23], ["Satay Scallops", 26],
    ["Braised King Prawn with Cashews", 26], ["Braised King Prawn with Vegetables", 26], ["Braised King Prawn in Chilli Sauce", 26],
    ["Honey King Prawn", 26, undefined, true], ["Szechuan Chilli King Prawn", 26], ["King Prawn in Peking Sauce", 26],
    ["King Prawn in Plum Sauce", 26], ["King Prawn in Special BBQ Sauce", 26], ["King Prawn in Crab Meat Sauce", 26.5], ["Salt & Pepper King Prawn", 26.5],
  ]),
  ...section("Sweet & Sour", "main", [["Sweet & Sour King Prawn", 26], ["Sweet & Sour Chicken", 22, undefined, true], ["Sweet & Sour Pork", 22], ["Sweet & Sour Fish", 22]]),
  ...section("Omelette", "main", [["King Prawn Omelette", 25], ["Chicken Omelette", 22], ["Combination Omelette", 23], ["BBQ Pork Omelette", 22], ["Plain Omelette", 18]]),
  ...section("Duck", "main", [
    ["Deep Fried Duck in Peking Sauce", 27], ["Deep Fried Duck in Lemon Sauce", 27], ["Deep Fried Duck in Plum Sauce", 27],
    ["Deep Fried Duck in Sweet & Sour Sauce", 27], ["Steam Duck in Crab Meat Sauce", 27], ["Steam Duck in Mushroom Oyster Sauce", 27],
  ]),
  ...section("Vegetable", "main", [["Stir Fried Mixed Vegetable", 20], ["Steamed Vegetable with Oyster Sauce", 20], ["Vegetable in Curry Sauce", 20], ["Steamed Broccoli", 21, "Onion, garlic and oyster sauce"]]),
  ...section("Chow Mein", "main", [
    ["King Prawn Chow Mein", 26, undefined, true], ["School Prawn Chow Mein", 23], ["Chicken Chow Mein", 22], ["Beef Chow Mein", 22],
    ["Combination Chow Mein", 24], ["Singapore Noodle", 20], ["BBQ Pork Chow Mein", 22],
  ]),
  ...section("Rice", "main", [
    ["Small Fried Rice", 11], ["Large Fried Rice", 13, undefined, true], ["King Prawn Fried Rice", 25], ["Special Fried Rice", 16],
    ["Singapore Fried Rice", 14], ["Malaysian Fried Rice", 14], ["Boiled Rice", 4, "Per head"],
  ]),
  ...section("Kids & Western", "main", [
    ["Chicken Nuggets & Chips", 10], ["Fish Cocktail & Chips", 10], ["Chicken Wings & Chips", 10], ["Calamari Rings & Chips", 10],
    ["Hot Chips", 7], ["Prawn Chips", 4.5], ["Prawn Cocktail", 10], ["Fish & Chips", 19], ["Home Made Chicken Schnitzel", 20], ["Garlic Bread", 5],
  ]),
  ...section("Dessert", "dessert", [
    ["Vanilla Ice Cream", 6, "Sample item — confirm with venue"], ["Banana Fritter", 9, "Sample item — confirm with venue"], ["Fresh Fruit Plate", 10, "Sample item — confirm with venue"],
  ]),
];

export const CATEGORIES = ["Popular", "Chef's suggestions", "Entrée", "Soup", "Chicken", "Beef", "Pork", "Hot Plate", "Seafood", "Sweet & Sour", "Omelette", "Duck", "Vegetable", "Chow Mein", "Rice", "Kids & Western", "Dessert"];
export const MODIFIERS = ["No onion", "No garlic", "Gluten allergy", "Nut allergy", "Mild", "Extra spicy", "Sauce on side", "No MSG"];
