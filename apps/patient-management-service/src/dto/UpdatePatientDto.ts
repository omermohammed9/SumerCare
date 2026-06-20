import {
    IsOptional,
    IsNotEmpty,
    Length,
    IsDateString,
    IsIn,
    IsNotIn,
    IsPhoneNumber,
    IsEmail,
    ArrayMaxSize, IsString, ArrayNotEmpty, Matches
} from 'class-validator';

class UpdatePatientDto {
    @IsOptional()
    @IsNotEmpty({ message: 'Name must not be empty' })
    @Length(10, 100)
    name?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsNotIn(['null'], { message: 'Gender must not be "null"' })
    @IsIn(['male', 'female'], {
        message: 'Gender must be either "male" or "female"',
    })
    @Length(2, 8)
    gender?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: Date;


    @IsOptional()
    @IsNotEmpty()
    @Length(10, 20)
    @IsPhoneNumber(undefined , { message: 'Invalid phone number' })
    phoneNumber?: string;

    @IsOptional()
    @IsNotEmpty()
    @Length(10, 100)
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsNotEmpty()
    @Length(10, 250)
    address?: string;

    @IsOptional()
    @IsNotEmpty()
    @Length(2, 100)
    emergencyContactName?: string;

    @IsOptional()
    @IsNotEmpty()
    @Length(10, 100)
    @IsPhoneNumber()
    emergencyContactPhone?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    bloodType?: string;

    @IsOptional()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @ArrayMaxSize(20)  // Limit the number of entries if needed
    allergies?: string[];


    @IsOptional()
    @IsNotEmpty()
    @Length(3, 255)
    medicalConditions?: string;


    @IsOptional()
    @IsNotEmpty()
    @Matches(/^\d{12}$/, { message: 'National ID must be exactly 12 digits (Iraqi National Card format)' })
    nationalId?: string;

}
export default UpdatePatientDto;