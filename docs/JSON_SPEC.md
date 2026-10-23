# Outtask Calendar JSON - New Gregorian + Repeatable Structure

This document explains the JSON for occasions. It is NOT inside the app code. The app now uses **Gregorian** dates as primary, with Jalali shown as secondary.

## Format
Array of objects.

```json
[
  {
    "id": "a1b2c3",
    "date": "2026-08-30",
    "title": "تولد سارا",
    "color": "#e4f222",
    "repeat": "yearly",
    "type": "birthday"
  },
  {
    "id": "d4e5f6",
    "date": "2026-09-10",
    "title": "جلسه پروژه",
    "color": "#6366f1",
    "repeat": "none",
    "type": "meeting"
  }
]
```

## Fields

### Required
- `date`: string, **Gregorian** date `YYYY-MM-DD`
  - Example: `2026-08-30`
  - Month 01-12, Day validated against Gregorian month length (including leap year)
- `title`: string, 1-120 chars, Persian/English

### Optional
- `id`: string, unique ID, auto-generated if missing
- `color`: hex `#RRGGBB`, default `#e4f222` (Acid Lime)
- `repeat`: `"none"` or `"yearly"`
  - `none`: shows only on exact date
  - `yearly`: repeats every year on same month-day (for birthdays, anniversaries). Example: `1990-08-30` with yearly will show every Aug 30
- `type`: `birthday`, `meeting`, `holiday`, `deadline`, `reminder`, `custom` (default `custom`)
- `description`: long text

## Matching Logic (implemented in app.js)
```js
function getOccasionsForGregorianDate(gDateStr){
  // gDateStr = "2026-08-30"
  return occasions.filter(o=>{
    if(o.date===gDateStr) return true;
    if(o.repeat==='yearly'){
      // compare MM-DD
      return o.date.slice(5) === gDateStr.slice(5);
    }
    return false;
  });
}
```

So a birthday stored as `1990-05-15` with `repeat: yearly` will match `2026-05-15`, `2027-05-15`, etc.

## Validation
1. Must be array
2. Each item needs `date` and `title`
3. `date` regex `/^\d{4}-\d{2}-\d{2}$/`
4. Month 1-12, Day 1-31 checked via `new Date(year,month,0).getDate()`
5. Max 1000 items

## Examples

### Birthday repeatable
```json
[
  {"date":"1995-03-21","title":"تولد علی","color":"#ec4899","repeat":"yearly","type":"birthday"},
  {"date":"2000-08-30","title":"تولد سارا","color":"#e4f222","repeat":"yearly"}
]
```

### Work events non-repeating
```json
[
  {"date":"2026-09-01","title":"Sprint Planning","color":"#6366f1","repeat":"none"},
  {"date":"2026-09-15","title":"Demo Day","color":"#02b8cc","repeat":"none"}
]
```

## UI Input System
Instead of raw JSON textarea, the app now has a form:
- Title input
- Date input (type=date, Gregorian picker)
- Color picker
- Checkbox "تکرار سالانه"
- Add button

The list below shows all occasions with delete. Export/Import still uses JSON file.

## Migration from old Jalali JSON
Old format had Jalali dates like `1405-06-08`. Those are year <1600. New app will still load them but they won't match Gregorian calendar unless you re-add them via new form. Recommendation: convert old Jalali to Gregorian using `toJalali` reverse or just re-enter birthdays in Gregorian with yearly repeat.
