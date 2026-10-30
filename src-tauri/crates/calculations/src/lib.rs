use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Serialize;
use std::str::FromStr;

#[derive(Debug, Serialize, PartialEq)]
pub struct DomesticDietBreakdown {
    pub full_diets: u32,
    pub half_diets: u32,
    pub gross_amount: String,
    pub meal_deduction: String,
    pub net_amount: String,
}

/// Domestic PL diet rules mirrored from the TypeScript engine.
pub fn calculate_domestic_diet(
    duration_hours: f64,
    full_diet_pln: &str,
    breakfast: u32,
    lunch: u32,
    dinner: u32,
    disabled: bool,
) -> Result<DomesticDietBreakdown, String> {
    if disabled {
        return Ok(DomesticDietBreakdown {
            full_diets: 0,
            half_diets: 0,
            gross_amount: "0.00".into(),
            meal_deduction: "0.00".into(),
            net_amount: "0.00".into(),
        });
    }
    if !duration_hours.is_finite() || duration_hours < 0.0 {
        return Err("Czas trwania musi być nieujemny".into());
    }

    let mut full_diets = 0u32;
    let mut half_diets = 0u32;

    if duration_hours <= 24.0 {
        if duration_hours < 8.0 {
            // zero
        } else if duration_hours <= 12.0 {
            half_diets = 1;
        } else {
            full_diets = 1;
        }
    } else {
        let full_days = (duration_hours / 24.0).floor() as u32;
        let rem = duration_hours - f64::from(full_days) * 24.0;
        full_diets = full_days;
        if rem > 0.0 {
            if rem <= 8.0 {
                half_diets = 1;
            } else {
                full_diets += 1;
            }
        }
    }

    let rate = Decimal::from_str(full_diet_pln).map_err(|_| "Nieprawidłowa stawka")?;
    let gross = rate * Decimal::from(full_diets) + rate * dec!(0.5) * Decimal::from(half_diets);
    let meal = rate * dec!(0.25) * Decimal::from(breakfast)
        + rate * dec!(0.5) * Decimal::from(lunch)
        + rate * dec!(0.25) * Decimal::from(dinner);
    let net = if gross > meal { gross - meal } else { Decimal::ZERO };

    Ok(DomesticDietBreakdown {
        full_diets,
        half_diets,
        gross_amount: format!("{:.2}", gross),
        meal_deduction: format!("{:.2}", meal),
        net_amount: format!("{:.2}", net),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn edge_hours() {
        assert_eq!(
            calculate_domestic_diet(7.983, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "0.00"
        );
        assert_eq!(
            calculate_domestic_diet(8.0, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "22.50"
        );
        assert_eq!(
            calculate_domestic_diet(12.0, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "22.50"
        );
        assert_eq!(
            calculate_domestic_diet(12.0167, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "45.00"
        );
        assert_eq!(
            calculate_domestic_diet(24.0, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "45.00"
        );
        assert_eq!(
            calculate_domestic_diet(24.0167, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "67.50"
        );
        assert_eq!(
            calculate_domestic_diet(32.0, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "67.50"
        );
        assert_eq!(
            calculate_domestic_diet(32.0167, "45.00", 0, 0, 0, false)
                .unwrap()
                .net_amount,
            "90.00"
        );
    }
}
