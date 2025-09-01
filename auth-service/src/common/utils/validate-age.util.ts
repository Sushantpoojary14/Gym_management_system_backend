import { BadRequestException } from '@nestjs/common';

export function validateAndCalculateAge(dateOfBirthStr: Date): number {
  if (!dateOfBirthStr) {
    throw new BadRequestException('Date of birth is required');
  }

  const dob = new Date(dateOfBirthStr);
  if (isNaN(dob.getTime())) {
    throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD or ISO 8601 format');
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const hasBirthdayPassedThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasBirthdayPassedThisYear) {
    age--;
  }

  if (age < 18) {
    throw new BadRequestException('User must be at least 18 years old');
  }

  return age;
}
