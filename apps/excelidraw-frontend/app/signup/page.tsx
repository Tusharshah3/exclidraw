'use client';

import React, { useState, FormEvent, Dispatch, SetStateAction } from 'react';
import { ZodError } from 'zod';
import axios from 'axios';

import Input from '../_components/ui/Input';
import {Button} from '../_components/ui/Button';
import Alert from '../_components/ui/Alert';
import Image from 'next/image';
import { CreateUserSchema } from '../_components/ui/Schema';
import Link from 'next/Link';
import { useRouter } from 'next/navigation';
interface FormErrors {
  name?: string;
  username?: string;
  password?: string;
  general?: string;
}
const SignUp = () => {
  const router = useRouter(); 
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAlert, setShowAlert] = useState(false);
  
  const BASE_URL = "http://localhost:3001"; // Ensure this URL is correct

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setAuthLoading(true);

    try {
      const validatedData = CreateUserSchema.parse({ name, username, password });
      const response = await axios.post(`${BASE_URL}/signup`, validatedData);
      
      if (response.status >= 200 && response.status < 300) {
        setShowAlert(true);
        setTimeout(() => {
          router.push('/signin');
        }, 1500);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const formErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setErrors(formErrors);
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 411) {
            setErrors({ username: error.response.data.message || 'This email is already taken.' });
        } else {
            setErrors({ general: 'An unexpected server error occurred.' });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: keyof FormErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    // The component now returns a React Fragment <> containing all the elements
  <div className='bg-gradient-to-br from-red-600 via-white  to-purple-600 text-white'>
    <nav>
        <div className=" brand flex gap-2 items-center  ">
          <Link href={"/"} >          
            <Image src="../logo.svg" alt="App Logo" width={240} height={80} />
          </Link>
        
          </div>
      </nav>

    <div className="flex items-center  justify-center min-h-screen  ">
      <div className='w-[450px] shadow-lg rounded-2xl border-2 border-black '>
        <div className="m-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 ">
            Create an Account
          </h2>
          <p className="mt-2 text-sm font-semibold text-gray-600">
            Join us today!
          </p>
        </div>

        {/* The <form> element now handles the layout and submission */}
        <form className="mt-8 m-4 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm text-gray-800 -space-y-px">
            <div>
              <Input
                value={name}
                onChange={handleInputChange(setName, 'name')}
                placeholder='Your Name...'
                disabled={authLoading}
                label={'Name'}
                inputId={'name'}
              />
              {errors.name && <p className='text-red-500 text-sm mt-1 px-1'>{errors.name}</p>}
            </div>
            <div className="pt-4">
              <Input
                value={username}
                onChange={handleInputChange(setUsername, 'username')}
                placeholder='your@email.com'
                disabled={authLoading}
                label={'Email'}
                inputId={'username'}
                type='email'
              />
              {errors.username && <p className='text-red-500 text-sm mt-1 px-1'>{errors.username}</p>}
            </div>
            <div className="pt-4">
              <Input
                value={password}
                onChange={handleInputChange(setPassword, 'password')}
                type='password'
                placeholder='Password...'
                disabled={authLoading}
                label={'Password'}
                inputId={'password'}
              />
              {errors.password && <p className='text-red-500 text-sm mt-1 px-1'>{errors.password}</p>}
            </div>
          </div>
          
          {errors.general && <p className='text-red-500 text-sm text-center font-semibold pt-2'>{errors.general}</p>}

          <div className="pt-2">
            <Button 
              type='submit' 
              variant="primary" 
              size="lg" 
              disabled={authLoading}
              className="w-full"
            >
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
        <div className=" bold flex items-center justify-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-600 ">
            ...
          </h2>
        </div>
        <div>
          <h2 className="text-2xl  font-bold tracking-tight text-gray-900 flex items-center justify-center ">
            Having Login credential!
          </h2>
          
          <div className="mb-4 items-center justify-center flex gap-4 text-[0.75rem] md:text-[1rem] font-medium  text-white">
              <Link href={"/signin"}>
                <Button variant={"primary"} size="lg" className=" mt-2 h-12 w-[400px] px-6 bold rounded-lg bg-blue-600   hover:brightness-90" >
                  Sign in 
                </Button>
              </Link>
          </div>
        </div>
      </div>
      
      {/* The Alert is positioned outside the main div to act as an overlay */}
      {showAlert && (
        <Alert text='Account Created! Redirecting to sign in...' />
      )}
    </div>
  </div>
  );
};

export default SignUp;

