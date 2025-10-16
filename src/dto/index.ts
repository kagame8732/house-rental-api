import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsEnum,
  Length,
  Matches,
} from "class-validator";

// DTOs for Property
export class CreatePropertyDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  monthlyRent?: number;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  monthlyRent?: number;
}

export class PropertyQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

// DTOs for Tenant
export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @Length(16, 16, { message: "ID Number must be exactly 16 digits" })
  @Matches(/^\d{16}$/, { message: "ID Number must contain only digits" })
  idNumber!: string;

  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  payment?: number;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsEnum(["cash", "bank", "mobile_money"])
  paymentMethod?: "cash" | "bank" | "mobile_money";

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthsPaid?: number;

  @IsOptional()
  @IsDateString()
  stayStartDate?: string;

  @IsOptional()
  @IsDateString()
  stayEndDate?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(16, 16, { message: "ID Number must be exactly 16 digits" })
  @Matches(/^\d{16}$/, { message: "ID Number must contain only digits" })
  idNumber?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  payment?: number;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsEnum(["cash", "bank", "mobile_money"])
  paymentMethod?: "cash" | "bank" | "mobile_money";

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthsPaid?: number;

  @IsOptional()
  @IsDateString()
  stayStartDate?: string;

  @IsOptional()
  @IsDateString()
  stayEndDate?: string;
}

export class TenantQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}

// DTOs for Maintenance
export class CreateMaintenanceDto {
  @IsString()
  propertyId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  priority!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class MaintenanceQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}

// DTOs for Auth
export class LoginDto {
  @IsString()
  phone!: string;

  @IsString()
  password!: string;
}

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  password!: string;
}
